using HalalBank.Domain.Entities;

namespace HalalBank.Application.Interfaces;

public interface INotificationService
{
    Task SendReminderEmailAsync(Customer customer, Subscription subscription);
    Task SendStatusChangeEmailAsync(Customer customer, Subscription subscription, string oldStatus, string newStatus);
    Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody);
}
