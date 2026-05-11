using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface ISubscriptionPlanService
{
    Task<SubscriptionPlanDto?> GetByIdAsync(int id);
    Task<IEnumerable<SubscriptionPlanDto>> GetAllAsync();
    Task<SubscriptionPlanDto> CreateAsync(CreateSubscriptionPlanDto dto);
    Task UpdateAsync(int id, UpdateSubscriptionPlanDto dto);
    Task DeleteAsync(int id);
}
