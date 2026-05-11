using HalalBank.Domain.Entities;

namespace HalalBank.Domain.Interfaces;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByIdAsync(int id);
    Task<IEnumerable<Subscription>> GetByCustomerIdAsync(int customerId);
    Task<IEnumerable<Subscription>> GetOverdueAsync(DateTime currentDate);
    Task<IEnumerable<Subscription>> GetAllAsync();
    Task<int> GetActiveCountAsync();
    Task<IEnumerable<Subscription>> GetUpcomingPaymentsAsync(DateTime from, DateTime to);
    Task<Subscription> AddAsync(Subscription subscription);
    Task UpdateAsync(Subscription subscription);
    Task DeleteAsync(Subscription subscription);
}
