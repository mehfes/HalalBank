namespace HalalBank.Application.DTOs;

public class PaymentDto
{
    public int Id { get; set; }
    public int SubscriptionId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CreatePaymentDto
{
    public int SubscriptionId { get; set; }
    public decimal Amount { get; set; }
}

public class DebtResponseDto
{
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Period { get; set; } = string.Empty;
}
