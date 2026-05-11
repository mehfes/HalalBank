namespace HalalBank.Application.DTOs;

public class SubscriptionDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string SubscriptionNumber { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string SubscriptionType { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string BillingCycle { get; set; } = string.Empty;
    public DateTime NextPaymentDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CreateSubscriptionDto
{
    public int CustomerId { get; set; }
    public string SubscriptionNumber { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string SubscriptionType { get; set; } = "Other";
    public decimal Price { get; set; }
    public string BillingCycle { get; set; } = "Monthly";
    public DateTime NextPaymentDate { get; set; }
}

public class UpdateSubscriptionDto
{
    public string? SubscriptionNumber { get; set; }
    public string? ProviderName { get; set; }
    public string? Category { get; set; }
    public string? SubscriptionType { get; set; }
    public decimal? Price { get; set; }
    public string? BillingCycle { get; set; }
    public DateTime? NextPaymentDate { get; set; }
    public string? Status { get; set; }
}
