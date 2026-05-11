namespace HalalBank.Application.Interfaces;

public interface IExternalPaymentService
{
    Task<CheckDebtResponse> CheckDebtAsync(int subscriptionId);
    Task<ProcessPaymentResponse> ProcessPaymentAsync(decimal amount);
}

public class CheckDebtResponse
{
    public decimal Amount { get; set; }
}

public class ProcessPaymentResponse
{
    public bool IsSuccess { get; set; }
    public string TransactionId { get; set; } = string.Empty;
}
