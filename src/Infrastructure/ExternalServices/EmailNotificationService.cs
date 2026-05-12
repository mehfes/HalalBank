using System.Net;
using System.Net.Mail;
using HalalBank.Application.Interfaces;
using HalalBank.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HalalBank.Infrastructure.ExternalServices;

public class EmailNotificationService : INotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(IConfiguration configuration, ILogger<EmailNotificationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendStatusChangeEmailAsync(Customer customer, Subscription subscription, string oldStatus, string newStatus)
    {
        var smtpServer = _configuration["EmailSettings:SmtpServer"];
        var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
        var senderEmail = _configuration["EmailSettings:SenderEmail"];
        var senderName = _configuration["EmailSettings:SenderName"] ?? "HalalBank";
        var username = _configuration["EmailSettings:Username"];
        var password = _configuration["EmailSettings:Password"];

        if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(senderEmail) || senderEmail == "your-email@gmail.com")
        {
            _logger.LogWarning("SMTP not configured. Falling back to console log for status change email to {Email}", customer.Email);
            _logger.LogInformation(
                "📧 STATUS CHANGE EMAIL --- To: {Email} | Subject: Subscription '{Provider}' Status Changed | " +
                "Body: Dear {Name}, your subscription '{Provider}' ({Category}) status has changed from {OldStatus} to {NewStatus}. Subscription #: {SubNo}.",
                customer.Email, subscription.ProviderName,
                $"{customer.FirstName} {customer.LastName}",
                subscription.ProviderName, subscription.Category,
                oldStatus, newStatus,
                subscription.SubscriptionNumber);
            return;
        }

        try
        {
            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true,
                Timeout = 10000
            };

            var body = $@"
<html>
<body style='font-family: Arial, sans-serif; padding: 20px;'>
    <h2 style='color: #059669;'>HalalBank - Subscription Status Update</h2>
    <p>Dear <strong>{customer.FirstName} {customer.LastName}</strong>,</p>
    <p>We would like to inform you that the status of your subscription has been updated.</p>
    <table style='border-collapse: collapse; margin: 20px 0; width: 100%; max-width: 500px;'>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>Subscription</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd;'>{subscription.ProviderName}</td></tr>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>Category</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd;'>{subscription.Category}</td></tr>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>Previous Status</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd; color: #dc2626;'>{oldStatus}</td></tr>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>New Status</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd; color: #059669; font-weight: bold;'>{newStatus}</td></tr>
        <tr><td style='padding: 8px;'><strong>Subscription #</strong></td><td style='padding: 8px;'>{subscription.SubscriptionNumber}</td></tr>
    </table>
    <p>If you have any questions, please contact our support team.</p>
    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'/>
    <p style='color: #888; font-size: 12px;'>This is an automated message from HalalBank. Please do not reply.</p>
</body>
</html>";

            var mail = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = $"Subscription '{subscription.ProviderName}' Status Changed to {newStatus}",
                Body = body,
                IsBodyHtml = true
            };
            mail.To.Add(customer.Email);

            await client.SendMailAsync(mail);

            _logger.LogInformation(
                "✅ REAL STATUS CHANGE EMAIL SENT to {Email} for subscription {Provider} (Sub #{SubNo}): {Old} → {New}",
                customer.Email, subscription.ProviderName, subscription.SubscriptionNumber, oldStatus, newStatus);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SMTP failed for {Email}. Falling back to console log for status change.",
                customer.Email);
            _logger.LogInformation(
                "📧 STATUS CHANGE EMAIL --- To: {Email} | Subject: Subscription '{Provider}' Status Changed | " +
                "Body: Dear {Name}, your subscription '{Provider}' ({Category}) status has changed from {OldStatus} to {NewStatus}. Subscription #: {SubNo}.",
                customer.Email, subscription.ProviderName,
                $"{customer.FirstName} {customer.LastName}",
                subscription.ProviderName, subscription.Category,
                oldStatus, newStatus,
                subscription.SubscriptionNumber);
        }
    }

    public async Task SendReminderEmailAsync(Customer customer, Subscription subscription)
    {
        var smtpServer = _configuration["EmailSettings:SmtpServer"];
        var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
        var senderEmail = _configuration["EmailSettings:SenderEmail"];
        var senderName = _configuration["EmailSettings:SenderName"] ?? "HalalBank";
        var username = _configuration["EmailSettings:Username"];
        var password = _configuration["EmailSettings:Password"];

        if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(senderEmail) || senderEmail == "your-email@gmail.com")
        {
            _logger.LogWarning("SMTP not configured. Falling back to console log for email to {Email}", customer.Email);
            _logger.LogInformation(
                "📧 REMINDER EMAIL --- To: {Email} | Subject: Upcoming Payment Reminder for {Provider} | " +
                "Body: Dear {Name}, your subscription '{Provider}' ({Category}, ${Price}) " +
                "is due on {Date}. Subscription #: {SubNo}.",
                customer.Email, subscription.ProviderName,
                $"{customer.FirstName} {customer.LastName}",
                subscription.ProviderName, subscription.Category,
                subscription.Price,
                subscription.NextPaymentDate.ToString("dd MMM yyyy"),
                subscription.SubscriptionNumber);
            return;
        }

        try
        {
            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true,
                Timeout = 10000
            };

            var body = $@"
<html>
<body style='font-family: Arial, sans-serif; padding: 20px;'>
    <h2 style='color: #059669;'>HalalBank Payment Reminder</h2>
    <p>Dear <strong>{customer.FirstName} {customer.LastName}</strong>,</p>
    <p>This is a reminder that your upcoming subscription payment is due soon.</p>
    <table style='border-collapse: collapse; margin: 20px 0; width: 100%; max-width: 500px;'>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>Subscription</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd;'>{subscription.ProviderName}</td></tr>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>Category</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd;'>{subscription.Category}</td></tr>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>Amount</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd;'>${subscription.Price:F2}</td></tr>
        <tr><td style='padding: 8px; border-bottom: 1px solid #ddd;'><strong>Due Date</strong></td><td style='padding: 8px; border-bottom: 1px solid #ddd;'>{subscription.NextPaymentDate:dd MMM yyyy}</td></tr>
        <tr><td style='padding: 8px;'><strong>Subscription #</strong></td><td style='padding: 8px;'>{subscription.SubscriptionNumber}</td></tr>
    </table>
    <p>Please ensure you have sufficient funds in your account.</p>
    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'/>
    <p style='color: #888; font-size: 12px;'>This is an automated message from HalalBank. Please do not reply.</p>
</body>
</html>";

            var mail = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = $"Upcoming Payment Reminder for {subscription.ProviderName}",
                Body = body,
                IsBodyHtml = true
            };
            mail.To.Add(customer.Email);

            await client.SendMailAsync(mail);

            _logger.LogInformation(
                "✅ REAL EMAIL SENT to {Email} for subscription {Provider} (Sub #{SubNo})",
                customer.Email, subscription.ProviderName, subscription.SubscriptionNumber);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SMTP failed for {Email}. Falling back to console log for subscription {Provider}",
                customer.Email, subscription.ProviderName);
            _logger.LogInformation(
                "📧 REMINDER EMAIL --- To: {Email} | Subject: Upcoming Payment Reminder for {Provider} | " +
                "Body: Dear {Name}, your subscription '{Provider}' ({Category}, ${Price}) " +
                "is due on {Date}. Subscription #: {SubNo}.",
                customer.Email, subscription.ProviderName,
                $"{customer.FirstName} {customer.LastName}",
                subscription.ProviderName, subscription.Category,
                subscription.Price,
                subscription.NextPaymentDate.ToString("dd MMM yyyy"),
                subscription.SubscriptionNumber);
        }
    }
}
