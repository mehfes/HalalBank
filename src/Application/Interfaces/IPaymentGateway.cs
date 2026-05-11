namespace HalalBank.Application.Interfaces;

public interface IPaymentGateway
{
    Task<bool> ProcessPaymentAsync(decimal amount, string reference);
}
