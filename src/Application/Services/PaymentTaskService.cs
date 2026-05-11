using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;
using HalalBank.Domain.Interfaces;

namespace HalalBank.Application.Services;

public class PaymentTaskService : IPaymentTaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IExternalPaymentService _externalPaymentService;

    public PaymentTaskService(IUnitOfWork unitOfWork, IExternalPaymentService externalPaymentService)
    {
        _unitOfWork = unitOfWork;
        _externalPaymentService = externalPaymentService;
    }

    public async Task<PaymentTaskResult> ProcessOverdueSubscriptionsAsync()
    {
        var result = new PaymentTaskResult();
        var overdue = await _unitOfWork.Subscriptions.GetOverdueAsync(DateTime.UtcNow);

        result.CheckedCount = overdue.Count();

        foreach (var subscription in overdue)
        {
            try
            {
                var debt = await _externalPaymentService.CheckDebtAsync(subscription.Id);

                if (debt.Amount <= 0)
                {
                    result.SkippedCount++;
                    result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): No debt.");
                    continue;
                }

                var paymentResult = await _externalPaymentService.ProcessPaymentAsync(debt.Amount);

                if (!paymentResult.IsSuccess)
                {
                    result.FailedCount++;
                    result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): Payment failed.");
                    continue;
                }

                var payment = new Payment
                {
                    SubscriptionId = subscription.Id,
                    Amount = debt.Amount,
                    PaymentDate = DateTime.UtcNow,
                    Status = PaymentStatus.Success
                };

                subscription.NextPaymentDate = subscription.BillingCycle switch
                {
                    BillingCycle.Yearly => subscription.NextPaymentDate.AddYears(1),
                    _ => subscription.NextPaymentDate.AddMonths(1)
                };

                await _unitOfWork.Payments.AddAsync(payment);
                await _unitOfWork.Subscriptions.UpdateAsync(subscription);

                result.PaidCount++;
                result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): Paid {debt.Amount:C}. Next payment: {subscription.NextPaymentDate:yyyy-MM-dd}");
            }
            catch (Exception ex)
            {
                result.FailedCount++;
                result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): Error - {ex.Message}");
            }
        }

        if (result.PaidCount > 0 || result.FailedCount > 0)
        {
            await _unitOfWork.SaveChangesAsync();
        }

        return result;
    }
}
