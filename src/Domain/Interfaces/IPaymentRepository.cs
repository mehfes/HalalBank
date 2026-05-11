using HalalBank.Domain.Entities;

namespace HalalBank.Domain.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(int id);
    Task<IEnumerable<Payment>> GetBySubscriptionIdAsync(int subscriptionId);
    Task<IEnumerable<Payment>> GetAllAsync();
    Task<Payment> AddAsync(Payment payment);
}
