using HalalBank.Domain.Entities;

namespace HalalBank.Application.Interfaces;

public interface INotificationService
{
    Task SendReminderEmailAsync(Customer customer, Subscription subscription);
}
