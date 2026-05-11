namespace HalalBank.Domain.Interfaces;

public interface IUnitOfWork
{
    ICustomerRepository Customers { get; }
    ISubscriptionRepository Subscriptions { get; }
    IPaymentRepository Payments { get; }
    ISubscriptionPlanRepository SubscriptionPlans { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
