using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;

namespace HalalBank.Infrastructure.ExternalServices;

public class MockDebtService : IDebtService
{
    private static readonly Random _random = new();

    public Task<DebtResponseDto?> QueryDebtAsync(int subscriptionId, string providerName)
    {
        var debt = new DebtResponseDto
        {
            Amount = Math.Round((decimal)(_random.NextDouble() * 1000 + 50), 2),
            DueDate = DateTime.UtcNow.AddDays(_random.Next(1, 30)),
            Period = $"{DateTime.UtcNow.Year} {(DateTime.UtcNow.Month):D2}"
        };

        return Task.FromResult<DebtResponseDto?>(debt);
    }
}
