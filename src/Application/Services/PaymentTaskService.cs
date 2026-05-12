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

    public async Task<PaymentTaskResult> ProcessOverdueSubscriptionsAsync(DateTime? cutoffDate = null)
    {
        var result = new PaymentTaskResult();
        var cutoff = cutoffDate ?? DateTime.UtcNow;
        var overdue = await _unitOfWork.Subscriptions.GetOverdueAsync(cutoff);

        result.CheckedCount = overdue.Count();

        foreach (var subscription in overdue)
        {
            await ProcessSingleSubscription(subscription, result);
        }

        if (result.PaidCount > 0 || result.FailedCount > 0)
        {
            await _unitOfWork.SaveChangesAsync();
        }

        return result;
    }

    public async Task<PaymentTaskResult> ProcessSubscriptionPaymentAsync(int subscriptionId)
    {
        var result = new PaymentTaskResult();
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(subscriptionId);

        if (subscription is null)
        {
            result.Details.Add($"Subscription {subscriptionId} not found.");
            return result;
        }

        result.CheckedCount = 1;

        var now = DateTime.UtcNow;
        var alreadyPaid = await _unitOfWork.Payments.HasSuccessfulPaymentForPeriodAsync(subscriptionId, now.Year, now.Month);
        if (alreadyPaid)
        {
            result.SkippedCount++;
            result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): Already paid for this period.");
            return result;
        }

        if (subscription.NextPaymentDate > now)
        {
            result.SkippedCount++;
            result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): Not yet due (next payment {subscription.NextPaymentDate:yyyy-MM-dd}).");
            return result;
        }

        await ProcessSingleSubscription(subscription, result);

        if (result.PaidCount > 0 || result.FailedCount > 0)
        {
            await _unitOfWork.SaveChangesAsync();
        }

        return result;
    }

    private async Task ProcessSingleSubscription(Subscription subscription, PaymentTaskResult result)
    {
        try
        {
            var debt = await _externalPaymentService.CheckDebtAsync(subscription.Id, subscription.Price);

            if (debt.Amount <= 0)
            {
                result.SkippedCount++;
                result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): No debt.");
                return;
            }

            var paymentResult = await _externalPaymentService.ProcessPaymentAsync(debt.Amount);

            if (!paymentResult.IsSuccess)
            {
                result.FailedCount++;
                result.Details.Add($"Subscription {subscription.Id} ({subscription.ProviderName}): Payment failed.");
                return;
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
}
