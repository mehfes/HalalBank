using HalalBank.Domain.Enums;

namespace HalalBank.Domain.Entities;

public class Subscription
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public BillingCycle BillingCycle { get; set; }
    public DateTime NextPaymentDate { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    public Customer Customer { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
