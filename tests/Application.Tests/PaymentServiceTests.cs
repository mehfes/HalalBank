using FluentAssertions;
using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Services;
using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;
using HalalBank.Domain.Interfaces;
using Moq;

namespace Application.Tests;

public class PaymentServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IPaymentRepository> _paymentRepoMock;
    private readonly Mock<ISubscriptionRepository> _subscriptionRepoMock;
    private readonly Mock<IDebtService> _debtServiceMock;
    private readonly Mock<IPaymentGateway> _paymentGatewayMock;
    private readonly PaymentService _sut;

    public PaymentServiceTests()
    {
        _paymentRepoMock = new Mock<IPaymentRepository>();
        _subscriptionRepoMock = new Mock<ISubscriptionRepository>();
        _debtServiceMock = new Mock<IDebtService>();
        _paymentGatewayMock = new Mock<IPaymentGateway>();

        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _unitOfWorkMock.Setup(u => u.Payments).Returns(_paymentRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Subscriptions).Returns(_subscriptionRepoMock.Object);

        _sut = new PaymentService(_unitOfWorkMock.Object, _debtServiceMock.Object, _paymentGatewayMock.Object);
    }

    [Fact]
    public async Task PayAsync_WhenAlreadyPaidForPeriod_ShouldThrowInvalidOperationException()
    {
        var now = DateTime.UtcNow;
        var subscription = new Subscription
        {
            Id = 1,
            CustomerId = 1,
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = now.AddDays(-1),
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(subscription);

        _paymentRepoMock
            .Setup(r => r.HasSuccessfulPaymentForPeriodAsync(1, now.Year, now.Month))
            .ReturnsAsync(true);

        var dto = new CreatePaymentDto { SubscriptionId = 1, Amount = 15.99m };

        var act = async () => await _sut.PayAsync(dto);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Already paid for this period.");

        _paymentGatewayMock.Verify(g => g.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<string>()), Times.Never);
        _paymentRepoMock.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task QueryDebtAsync_WhenAlreadyPaidForPeriod_ShouldReturnAmountZero()
    {
        var now = DateTime.UtcNow;
        var subscription = new Subscription
        {
            Id = 1,
            CustomerId = 1,
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = now.AddDays(-1),
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(subscription);

        _paymentRepoMock
            .Setup(r => r.HasSuccessfulPaymentForPeriodAsync(1, now.Year, now.Month))
            .ReturnsAsync(true);

        var result = await _sut.QueryDebtAsync(1);

        result.Should().NotBeNull();
        result!.Amount.Should().Be(0);
        result.Period.Should().Be($"{now.Year} {now.Month:D2}");
    }
}
