using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Mappers;
using HalalBank.Domain.Enums;
using HalalBank.Domain.Interfaces;

namespace HalalBank.Application.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly IUnitOfWork _unitOfWork;

    public SubscriptionService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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
        var created = await _unitOfWork.Subscriptions.AddAsync(subscription);
        await _unitOfWork.SaveChangesAsync();
        return created.ToDto();
    }

    public async Task UpdateAsync(int id, UpdateSubscriptionDto dto)
    {
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(id);
        if (subscription is null) throw new KeyNotFoundException($"Subscription with id {id} not found.");

        if (dto.ProviderName is not null) subscription.ProviderName = dto.ProviderName;
        if (dto.Category is not null) subscription.Category = dto.Category;
        if (dto.Price.HasValue) subscription.Price = dto.Price.Value;
        if (dto.BillingCycle is not null) subscription.BillingCycle = Enum.Parse<BillingCycle>(dto.BillingCycle);
        if (dto.NextPaymentDate.HasValue) subscription.NextPaymentDate = dto.NextPaymentDate.Value;
        if (dto.Status is not null) subscription.Status = Enum.Parse<SubscriptionStatus>(dto.Status);

        await _unitOfWork.Subscriptions.UpdateAsync(subscription);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(id);
        if (subscription is null) throw new KeyNotFoundException($"Subscription with id {id} not found.");
        await _unitOfWork.Subscriptions.DeleteAsync(subscription);
        await _unitOfWork.SaveChangesAsync();
    }
}
