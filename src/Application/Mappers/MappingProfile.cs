using HalalBank.Application.DTOs;
using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;

namespace HalalBank.Application.Mappers;

public static class MappingProfile
{
    public static CustomerDto ToDto(this Customer customer)
    {
        return new CustomerDto
        {
            Id = customer.Id,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Email = customer.Email,
            CreatedDate = customer.CreatedDate
        };
    }

    public static Customer ToEntity(this CreateCustomerDto dto)
    {
        return new Customer
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email
        };
    }

    public static SubscriptionDto ToDto(this Subscription subscription)
    {
        return new SubscriptionDto
        {
            Id = subscription.Id,
            CustomerId = subscription.CustomerId,
            SubscriptionNumber = subscription.SubscriptionNumber,
            ProviderName = subscription.ProviderName,
            Category = subscription.Category,
            Price = subscription.Price,
            BillingCycle = subscription.BillingCycle.ToString(),
            NextPaymentDate = subscription.NextPaymentDate,
            Status = subscription.Status.ToString()
        };
    }

    public static Subscription ToEntity(this CreateSubscriptionDto dto)
    {
        return new Subscription
        {
            CustomerId = dto.CustomerId,
            SubscriptionNumber = dto.SubscriptionNumber,
            ProviderName = dto.ProviderName,
            Category = dto.Category,
            Price = dto.Price,
            BillingCycle = Enum.Parse<BillingCycle>(dto.BillingCycle),
            NextPaymentDate = dto.NextPaymentDate
        };
    }

    public static PaymentDto ToDto(this Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            SubscriptionId = payment.SubscriptionId,
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate,
            Status = payment.Status.ToString()
        };
    }

    public static Payment ToEntity(this CreatePaymentDto dto)
    {
        return new Payment
        {
            SubscriptionId = dto.SubscriptionId,
            Amount = dto.Amount,
            PaymentDate = DateTime.UtcNow,
            Status = PaymentStatus.Success
        };
    }
}
