using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface IPaymentService
{
    Task<PaymentDto?> GetByIdAsync(int id);
    Task<IEnumerable<PaymentDto>> GetBySubscriptionIdAsync(int subscriptionId);
    Task<IEnumerable<PaymentDto>> GetAllAsync();
    Task<DebtResponseDto?> QueryDebtAsync(int subscriptionId);
    Task<PaymentDto> PayAsync(CreatePaymentDto dto);
}
