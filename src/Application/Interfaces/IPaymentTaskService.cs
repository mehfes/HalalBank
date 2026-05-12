using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface IPaymentTaskService
{
    Task<PaymentTaskResult> ProcessOverdueSubscriptionsAsync(DateTime? cutoffDate = null);
    Task<PaymentTaskResult> ProcessSubscriptionPaymentAsync(int subscriptionId);
}

public class PaymentTaskResult
{
    public int CheckedCount { get; set; }
    public int PaidCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Details { get; set; } = new();
}
