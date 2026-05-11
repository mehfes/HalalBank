namespace HalalBank.Domain.Entities;

public class SubscriptionPlan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal DefaultPrice { get; set; }
    public string DefaultBillingCycle { get; set; } = string.Empty;
}
