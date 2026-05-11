using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface IPaymentTaskService
{
    Task<PaymentTaskResult> ProcessOverdueSubscriptionsAsync();
}

public class PaymentTaskResult
{
    public int CheckedCount { get; set; }
    public int PaidCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Details { get; set; } = new();
}
