using HalalBank.Domain.Entities;
using HalalBank.Domain.Interfaces;
using HalalBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HalalBank.Infrastructure.Repositories;

public class SubscriptionPlanRepository : ISubscriptionPlanRepository
{
    private readonly AppDbContext _context;

    public SubscriptionPlanRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SubscriptionPlan?> GetByIdAsync(int id) =>
        await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == id);

    public async Task<IEnumerable<SubscriptionPlan>> GetAllAsync() =>
        await _context.SubscriptionPlans.ToListAsync();

    public async Task<SubscriptionPlan> AddAsync(SubscriptionPlan plan)
    {
        await _context.SubscriptionPlans.AddAsync(plan);
        return plan;
    }

    public Task UpdateAsync(SubscriptionPlan plan)
    {
        _context.SubscriptionPlans.Update(plan);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(SubscriptionPlan plan)
    {
        _context.SubscriptionPlans.Remove(plan);
        return Task.CompletedTask;
    }
}
