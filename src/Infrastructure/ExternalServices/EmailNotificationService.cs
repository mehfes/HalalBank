using System.Text;
using System.Text.Json;
using HalalBank.Application.Interfaces;
using HalalBank.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HalalBank.Infrastructure.ExternalServices;

public class EmailNotificationService : INotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailNotificationService> _logger;
    private static readonly HttpClient _httpClient = new();

    public EmailNotificationService(IConfiguration configuration, ILogger<EmailNotificationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendStatusChangeEmailAsync(Customer customer, Subscription subscription, string oldStatus, string newStatus)
    {
        var apiKey = _configuration["EmailSettings:SendGridApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("SendGrid not configured. Falling back to console log for status change email to {Email}", customer.Email);
            LogToConsole(customer, subscription, oldStatus, newStatus);
            return;
        }

        try
        {
            await SendViaSendGrid(apiKey, customer.Email, $"{customer.FirstName} {customer.LastName}",
                $"Subscription '{subscription.ProviderName}' Status Changed to {newStatus}",
                BuildStatusChangeBody(customer, subscription, oldStatus, newStatus));

            _logger.LogInformation(
                "✅ REAL STATUS CHANGE EMAIL SENT to {Email} for subscription {Provider} (Sub #{SubNo}): {Old} → {New}",
                customer.Email, subscription.ProviderName, subscription.SubscriptionNumber, oldStatus, newStatus);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SendGrid failed for {Email}. Falling back to console log for status change.", customer.Email);
            LogToConsole(customer, subscription, oldStatus, newStatus);
        }
    }

    public async Task SendReminderEmailAsync(Customer customer, Subscription subscription)
    {
        var apiKey = _configuration["EmailSettings:SendGridApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("SendGrid not configured. Falling back to console log for email to {Email}", customer.Email);
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
            await SendViaSendGrid(apiKey, customer.Email, $"{customer.FirstName} {customer.LastName}",
                $"Upcoming Payment Reminder for {subscription.ProviderName}",
                BuildReminderBody(customer, subscription));

            _logger.LogInformation(
                "✅ REAL EMAIL SENT to {Email} for subscription {Provider} (Sub #{SubNo})",
                customer.Email, subscription.ProviderName, subscription.SubscriptionNumber);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SendGrid failed for {Email}. Falling back to console log for subscription {Provider}", customer.Email, subscription.ProviderName);
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

    private async Task SendViaSendGrid(string apiKey, string toEmail, string toName, string subject, string htmlBody)
    {
        var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "noreply@halalbank.com";
        var senderName = _configuration["EmailSettings:SenderName"] ?? "HalalBank";

        var payload = new
        {
            personalizations = new[]
            {
                new { to = new[] { new { email = toEmail, name = toName } } }
            },
            from = new { email = senderEmail, name = senderName },
            subject,
            content = new[] { new { type = "text/html", value = htmlBody } }
        };

        var json = JsonSerializer.Serialize(payload);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sendgrid.com/v3/mail/send")
        {
            Headers = { { "Authorization", $"Bearer {apiKey}" } },
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("SendGrid returned {Status}: {Body}", response.StatusCode, body);
        }
        response.EnsureSuccessStatusCode();
    }

    private static string BuildStatusChangeBody(Customer customer, Subscription subscription, string oldStatus, string newStatus)
    {
        return $@"
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
    }

    private static string BuildReminderBody(Customer customer, Subscription subscription)
    {
        return $@"
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
    }

    public async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var apiKey = _configuration["EmailSettings:SendGridApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("SendGrid not configured. Falling back to console log for email to {Email}", toEmail);
            _logger.LogInformation("📧 EMAIL --- To: {Email} | Subject: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            await SendViaSendGrid(apiKey, toEmail, toName, subject, htmlBody);
            _logger.LogInformation("✅ REAL EMAIL SENT to {Email} | Subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SendGrid failed for {Email} | Subject: {Subject}. Falling back to console log.", toEmail, subject);
            _logger.LogInformation("📧 EMAIL --- To: {Email} | Subject: {Subject}", toEmail, subject);
        }
    }

    private void LogToConsole(Customer customer, Subscription subscription, string oldStatus, string newStatus)
    {
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
