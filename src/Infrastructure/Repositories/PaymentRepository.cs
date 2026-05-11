using HalalBank.Domain.Entities;
using HalalBank.Domain.Interfaces;
using HalalBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HalalBank.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;

    public PaymentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Payment?> GetByIdAsync(int id) =>
        await _context.Payments.Include(p => p.Subscription).FirstOrDefaultAsync(p => p.Id == id);

    public async Task<IEnumerable<Payment>> GetBySubscriptionIdAsync(int subscriptionId) =>
        await _context.Payments.Where(p => p.SubscriptionId == subscriptionId).OrderByDescending(p => p.PaymentDate).ToListAsync();

    public async Task<IEnumerable<Payment>> GetAllAsync() =>
        await _context.Payments.Include(p => p.Subscription).ToListAsync();

    public async Task<Payment> AddAsync(Payment payment)
    {
        await _context.Payments.AddAsync(payment);
        return payment;
    }
}
