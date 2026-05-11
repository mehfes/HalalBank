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
}
