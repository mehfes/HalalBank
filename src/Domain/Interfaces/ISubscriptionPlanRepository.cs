using HalalBank.Domain.Entities;

namespace HalalBank.Domain.Interfaces;

public interface ISubscriptionPlanRepository
{
    Task<SubscriptionPlan?> GetByIdAsync(int id);
    Task<IEnumerable<SubscriptionPlan>> GetAllAsync();
    Task<SubscriptionPlan> AddAsync(SubscriptionPlan plan);
    Task UpdateAsync(SubscriptionPlan plan);
    Task DeleteAsync(SubscriptionPlan plan);
}
