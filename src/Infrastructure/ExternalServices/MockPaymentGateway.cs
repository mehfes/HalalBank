using HalalBank.Application.Interfaces;

namespace HalalBank.Infrastructure.ExternalServices;

public class MockPaymentGateway : IPaymentGateway
{
    public Task<bool> ProcessPaymentAsync(decimal amount, string reference)
    {
        var success = amount > 0;
        return Task.FromResult(success);
    }
}
