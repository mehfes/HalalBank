using HalalBank.Domain.Interfaces;
using HalalBank.Infrastructure.Data;

namespace HalalBank.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private ICustomerRepository? _customers;
    private ISubscriptionRepository? _subscriptions;
    private IPaymentRepository? _payments;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public ICustomerRepository Customers =>
        _customers ??= new CustomerRepository(_context);

    public ISubscriptionRepository Subscriptions =>
        _subscriptions ??= new SubscriptionRepository(_context);

    public IPaymentRepository Payments =>
        _payments ??= new PaymentRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        await _context.SaveChangesAsync(cancellationToken);

    public void Dispose() => _context.Dispose();
}
