using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface IDebtService
{
    Task<DebtResponseDto?> QueryDebtAsync(int subscriptionId, string providerName);
}
