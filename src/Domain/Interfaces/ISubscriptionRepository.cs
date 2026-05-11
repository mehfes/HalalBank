using HalalBank.Domain.Entities;

namespace HalalBank.Domain.Interfaces;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByIdAsync(int id);
    Task<IEnumerable<Subscription>> GetByCustomerIdAsync(int customerId);
    Task<IEnumerable<Subscription>> GetAllAsync();
    Task<Subscription> AddAsync(Subscription subscription);
    Task UpdateAsync(Subscription subscription);
    Task DeleteAsync(Subscription subscription);
}
