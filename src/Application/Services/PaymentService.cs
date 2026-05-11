using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Mappers;
using HalalBank.Domain.Interfaces;

namespace HalalBank.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDebtService _debtService;
    private readonly IPaymentGateway _paymentGateway;

    public PaymentService(IUnitOfWork unitOfWork, IDebtService debtService, IPaymentGateway paymentGateway)
    {
        _unitOfWork = unitOfWork;
        _debtService = debtService;
        _paymentGateway = paymentGateway;
    }

    public async Task<PaymentDto?> GetByIdAsync(int id)
    {
        var payment = await _unitOfWork.Payments.GetByIdAsync(id);
        return payment?.ToDto();
    }

    public async Task<IEnumerable<PaymentDto>> GetBySubscriptionIdAsync(int subscriptionId)
    {
        var payments = await _unitOfWork.Payments.GetBySubscriptionIdAsync(subscriptionId);
        return payments.Select(p => p.ToDto());
    }

    public async Task<IEnumerable<PaymentDto>> GetAllAsync()
    {
        var payments = await _unitOfWork.Payments.GetAllAsync();
        return payments.Select(p => p.ToDto());
    }

    public async Task<DebtResponseDto?> QueryDebtAsync(int subscriptionId)
    {
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(subscriptionId);
        if (subscription is null) throw new KeyNotFoundException($"Subscription with id {subscriptionId} not found.");

        var now = DateTime.UtcNow;
        var alreadyPaid = await _unitOfWork.Payments.HasSuccessfulPaymentForPeriodAsync(subscriptionId, now.Year, now.Month);
        if (alreadyPaid)
        {
            return new DebtResponseDto { Amount = 0, DueDate = now, Period = $"{now.Year} {now.Month:D2}" };
        }

        return await _debtService.QueryDebtAsync(subscription.Id, subscription.ProviderName);
    }

    public async Task<PaymentDto> PayAsync(CreatePaymentDto dto)
    {
        var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(dto.SubscriptionId);
        if (subscription is null) throw new KeyNotFoundException($"Subscription with id {dto.SubscriptionId} not found.");

        var now = DateTime.UtcNow;
        var alreadyPaid = await _unitOfWork.Payments.HasSuccessfulPaymentForPeriodAsync(dto.SubscriptionId, now.Year, now.Month);
        if (alreadyPaid)
            throw new InvalidOperationException("Already paid for this period.");

        var success = await _paymentGateway.ProcessPaymentAsync(dto.Amount, $"SUB-{dto.SubscriptionId}");
        var payment = dto.ToEntity();
        if (!success) payment.Status = Domain.Enums.PaymentStatus.Fail;

        var created = await _unitOfWork.Payments.AddAsync(payment);
        await _unitOfWork.SaveChangesAsync();
        return created.ToDto();
    }
}
