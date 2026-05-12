using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Mappers;
using HalalBank.Domain.Enums;
using HalalBank.Domain.Interfaces;

namespace HalalBank.Application.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public SubscriptionService(IUnitOfWork unitOfWork, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<SubscriptionDto?> GetByIdAsync(int id)
    {
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(id);
        return subscription?.ToDto();
    }

    public async Task<IEnumerable<SubscriptionDto>> GetByCustomerIdAsync(int customerId)
    {
        var subscriptions = await _unitOfWork.Subscriptions.GetByCustomerIdAsync(customerId);
        return subscriptions.Select(s => s.ToDto());
    }

    public async Task<int> GetActiveCountAsync() =>
        await _unitOfWork.Subscriptions.GetActiveCountAsync();

    public async Task<IEnumerable<SubscriptionDto>> GetUpcomingPaymentsAsync(int daysAhead)
    {
        var now = DateTime.UtcNow;
        var subscriptions = await _unitOfWork.Subscriptions.GetUpcomingPaymentsAsync(now, now.AddDays(daysAhead));
        return subscriptions.Select(s => s.ToDto());
    }

    public async Task<IEnumerable<SubscriptionDto>> GetAllAsync()
    {
        var subscriptions = await _unitOfWork.Subscriptions.GetAllAsync();
        return subscriptions.Select(s => s.ToDto());
    }

    public async Task<SubscriptionDto> CreateAsync(CreateSubscriptionDto dto)
    {
        var subscription = dto.ToEntity();
        if (string.IsNullOrWhiteSpace(subscription.SubscriptionNumber))
            subscription.SubscriptionNumber = $"SUB-{Random.Shared.Next(10000, 99999)}";
        var created = await _unitOfWork.Subscriptions.AddAsync(subscription);
        await _unitOfWork.SaveChangesAsync();
        return created.ToDto();
    }

    public async Task UpdateAsync(int id, UpdateSubscriptionDto dto)
    {
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(id);
        if (subscription is null) throw new KeyNotFoundException($"Subscription with id {id} not found.");

        var oldStatus = subscription.Status.ToString();

        if (dto.ProviderName is not null) subscription.ProviderName = dto.ProviderName;
        if (dto.Category is not null) subscription.Category = dto.Category;
        if (dto.Price.HasValue) subscription.Price = dto.Price.Value;
        if (dto.BillingCycle is not null) subscription.BillingCycle = Enum.Parse<BillingCycle>(dto.BillingCycle);
        if (dto.NextPaymentDate.HasValue) subscription.NextPaymentDate = dto.NextPaymentDate.Value;
        if (dto.Status is not null) subscription.Status = Enum.Parse<SubscriptionStatus>(dto.Status);

        await _unitOfWork.Subscriptions.UpdateAsync(subscription);
        await _unitOfWork.SaveChangesAsync();

        if (dto.Status is not null && oldStatus != dto.Status)
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(subscription.CustomerId);
            if (customer is not null)
            {
                await _notificationService.SendStatusChangeEmailAsync(customer, subscription, oldStatus, dto.Status);
            }
        }
    }

    public async Task DeleteAsync(int id)
    {
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(id);
        if (subscription is null) throw new KeyNotFoundException($"Subscription with id {id} not found.");
        await _unitOfWork.Subscriptions.DeleteAsync(subscription);
        await _unitOfWork.SaveChangesAsync();
    }
}
