using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface ISubscriptionService
{
    Task<SubscriptionDto?> GetByIdAsync(int id);
    Task<IEnumerable<SubscriptionDto>> GetByCustomerIdAsync(int customerId);
    Task<IEnumerable<SubscriptionDto>> GetAllAsync();
    Task<SubscriptionDto> CreateAsync(CreateSubscriptionDto dto);
    Task UpdateAsync(int id, UpdateSubscriptionDto dto);
    Task DeleteAsync(int id);
}
