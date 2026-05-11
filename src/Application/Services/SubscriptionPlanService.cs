using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Mappers;
using HalalBank.Domain.Interfaces;

namespace HalalBank.Application.Services;

public class SubscriptionPlanService : ISubscriptionPlanService
{
    private readonly IUnitOfWork _unitOfWork;

    public SubscriptionPlanService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SubscriptionPlanDto?> GetByIdAsync(int id)
    {
        var plan = await _unitOfWork.SubscriptionPlans.GetByIdAsync(id);
        return plan?.ToDto();
    }

    public async Task<IEnumerable<SubscriptionPlanDto>> GetAllAsync()
    {
        var plans = await _unitOfWork.SubscriptionPlans.GetAllAsync();
        return plans.Select(p => p.ToDto());
    }

    public async Task<SubscriptionPlanDto> CreateAsync(CreateSubscriptionPlanDto dto)
    {
        var plan = dto.ToEntity();
        var created = await _unitOfWork.SubscriptionPlans.AddAsync(plan);
        await _unitOfWork.SaveChangesAsync();
        return created.ToDto();
    }

    public async Task UpdateAsync(int id, UpdateSubscriptionPlanDto dto)
    {
        var plan = await _unitOfWork.SubscriptionPlans.GetByIdAsync(id);
        if (plan is null) throw new KeyNotFoundException($"SubscriptionPlan with id {id} not found.");

        if (dto.Name is not null) plan.Name = dto.Name;
        if (dto.Category is not null) plan.Category = dto.Category;
        if (dto.DefaultPrice.HasValue) plan.DefaultPrice = dto.DefaultPrice.Value;
        if (dto.DefaultBillingCycle is not null) plan.DefaultBillingCycle = dto.DefaultBillingCycle;

        await _unitOfWork.SubscriptionPlans.UpdateAsync(plan);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var plan = await _unitOfWork.SubscriptionPlans.GetByIdAsync(id);
        if (plan is null) throw new KeyNotFoundException($"SubscriptionPlan with id {id} not found.");
        await _unitOfWork.SubscriptionPlans.DeleteAsync(plan);
        await _unitOfWork.SaveChangesAsync();
    }
}
