using HalalBank.Domain.Entities;
using HalalBank.Domain.Interfaces;
using HalalBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HalalBank.Infrastructure.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly AppDbContext _context;

    public SubscriptionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Subscription?> GetByIdAsync(int id) =>
        await _context.Subscriptions.Include(s => s.Customer).FirstOrDefaultAsync(s => s.Id == id);

    public async Task<IEnumerable<Subscription>> GetByCustomerIdAsync(int customerId) =>
        await _context.Subscriptions.Where(s => s.CustomerId == customerId).ToListAsync();

    public async Task<IEnumerable<Subscription>> GetOverdueAsync(DateTime currentDate) =>
        await _context.Subscriptions
            .Where(s => s.Status == Domain.Enums.SubscriptionStatus.Active && s.NextPaymentDate <= currentDate)
            .ToListAsync();

    public async Task<IEnumerable<Subscription>> GetAllAsync() =>
        await _context.Subscriptions.Include(s => s.Customer).ToListAsync();

    public async Task<Subscription> AddAsync(Subscription subscription)
    {
        await _context.Subscriptions.AddAsync(subscription);
        return subscription;
    }

    public Task UpdateAsync(Subscription subscription)
    {
        _context.Subscriptions.Update(subscription);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Subscription subscription)
    {
        _context.Subscriptions.Remove(subscription);
        return Task.CompletedTask;
    }
}
