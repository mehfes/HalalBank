using HalalBank.Application.Interfaces;
using HalalBank.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace HalalBank.Infrastructure.ExternalServices;

public class MockNotificationService : INotificationService
{
    private readonly ILogger<MockNotificationService> _logger;

    public MockNotificationService(ILogger<MockNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendOverdueEmailAsync(Customer customer, Subscription subscription)
    {
        _logger.LogInformation(
            "📧 OVERDUE EMAIL SENT --- To: {Email} | Subject: Payment Overdue for {Provider} | " +
            "Body: Dear {Name}, your subscription '{Provider}' ({Category}, ${Price}) " +
            "was due on {Date} and is now overdue. Subscription #: {SubNo}. Please pay immediately.",
            customer.Email,
            subscription.ProviderName,
            $"{customer.FirstName} {customer.LastName}",
            subscription.ProviderName,
            subscription.Category,
            subscription.Price,
            subscription.NextPaymentDate.ToString("dd MMM yyyy"),
            subscription.SubscriptionNumber);

        return Task.CompletedTask;
    }

    public Task SendReminderEmailAsync(Customer customer, Subscription subscription)
    {
        _logger.LogInformation(
            "📧 REMINDER EMAIL SENT --- To: {Email} | Subject: Upcoming Payment Reminder for {Provider} | " +
            "Body: Dear {Name}, this is a reminder that your subscription '{Provider}' ({Category}, ${Price}) " +
            "is due on {Date}. Your subscription number is {SubNo}. Please ensure sufficient funds.",
            customer.Email,
            subscription.ProviderName,
            $"{customer.FirstName} {customer.LastName}",
            subscription.ProviderName,
            subscription.Category,
            subscription.Price,
            subscription.NextPaymentDate.ToString("dd MMM yyyy"),
            subscription.SubscriptionNumber);

        return Task.CompletedTask;
    }

    public Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        _logger.LogInformation("📧 GENERIC EMAIL --- To: {Email} | Subject: {Subject}", toEmail, subject);
        return Task.CompletedTask;
    }

    public Task SendStatusChangeEmailAsync(Customer customer, Subscription subscription, string oldStatus, string newStatus)
    {
        _logger.LogInformation(
            "📧 STATUS CHANGE EMAIL SENT --- To: {Email} | Subject: Subscription '{Provider}' Status Changed | " +
            "Body: Dear {Name}, your subscription '{Provider}' ({Category}) status has been changed from {OldStatus} to {NewStatus}. " +
            "Subscription #: {SubNo}.",
            customer.Email,
            subscription.ProviderName,
            $"{customer.FirstName} {customer.LastName}",
            subscription.ProviderName,
            subscription.Category,
            oldStatus,
            newStatus,
            subscription.SubscriptionNumber);

        return Task.CompletedTask;
    }
}
