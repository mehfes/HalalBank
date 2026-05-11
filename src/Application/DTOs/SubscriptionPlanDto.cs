namespace HalalBank.Application.DTOs;

public class SubscriptionPlanDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal DefaultPrice { get; set; }
    public string DefaultBillingCycle { get; set; } = string.Empty;
}

public class CreateSubscriptionPlanDto
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal DefaultPrice { get; set; }
    public string DefaultBillingCycle { get; set; } = "Monthly";
}

public class UpdateSubscriptionPlanDto
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public decimal? DefaultPrice { get; set; }
    public string? DefaultBillingCycle { get; set; }
}
