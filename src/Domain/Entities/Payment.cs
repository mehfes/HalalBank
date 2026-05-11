using HalalBank.Domain.Enums;

namespace HalalBank.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public int SubscriptionId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public PaymentStatus Status { get; set; }

    public Subscription Subscription { get; set; } = null!;
}
