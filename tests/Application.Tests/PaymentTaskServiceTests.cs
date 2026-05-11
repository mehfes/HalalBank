using FluentAssertions;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Services;
using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;
using HalalBank.Domain.Interfaces;
using Moq;

namespace Application.Tests;

public class PaymentTaskServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ISubscriptionRepository> _subscriptionRepoMock;
    private readonly Mock<IPaymentRepository> _paymentRepoMock;
    private readonly Mock<IExternalPaymentService> _externalPaymentServiceMock;
    private readonly PaymentTaskService _sut;

    public PaymentTaskServiceTests()
    {
        _subscriptionRepoMock = new Mock<ISubscriptionRepository>();
        _paymentRepoMock = new Mock<IPaymentRepository>();
        _externalPaymentServiceMock = new Mock<IExternalPaymentService>();

        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _unitOfWorkMock.Setup(u => u.Subscriptions).Returns(_subscriptionRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Payments).Returns(_paymentRepoMock.Object);

        _sut = new PaymentTaskService(_unitOfWorkMock.Object, _externalPaymentServiceMock.Object);
    }

    [Fact]
    public async Task ProcessOverdueSubscriptionsAsync_WhenDebtExistsAndPaymentSucceeds_ShouldCreatePaymentAndRollNextDate()
    {
        // Arrange
        var originalDate = DateTime.UtcNow.AddDays(-1);

        var subscription = new Subscription
        {
            Id = 1,
            CustomerId = 1,
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = originalDate,
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetOverdueAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(new List<Subscription> { subscription });

        _externalPaymentServiceMock
            .Setup(s => s.CheckDebtAsync(subscription.Id))
            .ReturnsAsync(new CheckDebtResponse { Amount = 15.99m });

        _externalPaymentServiceMock
            .Setup(s => s.ProcessPaymentAsync(15.99m))
            .ReturnsAsync(new ProcessPaymentResponse { IsSuccess = true, TransactionId = "txn_123" });

        var expectedNextDate = originalDate.AddMonths(1);

        // Act
        var result = await _sut.ProcessOverdueSubscriptionsAsync();

        // Assert
        result.CheckedCount.Should().Be(1);
        result.PaidCount.Should().Be(1);
        result.FailedCount.Should().Be(0);
        result.SkippedCount.Should().Be(0);

        _paymentRepoMock.Verify(r => r.AddAsync(It.Is<Payment>(p =>
            p.SubscriptionId == 1 &&
            p.Amount == 15.99m &&
            p.Status == PaymentStatus.Success
        )), Times.Once);

        _subscriptionRepoMock.Verify(r => r.UpdateAsync(It.Is<Subscription>(s =>
            s.NextPaymentDate == expectedNextDate
        )), Times.Once);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessOverdueSubscriptionsAsync_WhenPaymentFails_ShouldNotCreatePaymentRecord()
    {
        // Arrange
        var subscription = new Subscription
        {
            Id = 2,
            CustomerId = 1,
            ProviderName = "Spotify",
            Category = "Music",
            Price = 9.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.AddDays(-1),
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetOverdueAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(new List<Subscription> { subscription });

        _externalPaymentServiceMock
            .Setup(s => s.CheckDebtAsync(subscription.Id))
            .ReturnsAsync(new CheckDebtResponse { Amount = 9.99m });

        _externalPaymentServiceMock
            .Setup(s => s.ProcessPaymentAsync(9.99m))
            .ReturnsAsync(new ProcessPaymentResponse { IsSuccess = false });

        // Act
        var result = await _sut.ProcessOverdueSubscriptionsAsync();

        // Assert
        result.CheckedCount.Should().Be(1);
        result.PaidCount.Should().Be(0);
        result.FailedCount.Should().Be(1);
        result.SkippedCount.Should().Be(0);

        _paymentRepoMock.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Never);
        _subscriptionRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Subscription>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessOverdueSubscriptionsAsync_WhenNoDebt_ShouldSkipProcessing()
    {
        // Arrange
        var subscription = new Subscription
        {
            Id = 3,
            CustomerId = 2,
            ProviderName = "Electricity Bill",
            Category = "Utilities",
            Price = 120.00m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.AddDays(-1),
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetOverdueAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(new List<Subscription> { subscription });

        _externalPaymentServiceMock
            .Setup(s => s.CheckDebtAsync(subscription.Id))
            .ReturnsAsync(new CheckDebtResponse { Amount = 0 });

        // Act
        var result = await _sut.ProcessOverdueSubscriptionsAsync();

        // Assert
        result.CheckedCount.Should().Be(1);
        result.PaidCount.Should().Be(0);
        result.FailedCount.Should().Be(0);
        result.SkippedCount.Should().Be(1);

        _externalPaymentServiceMock.Verify(s => s.ProcessPaymentAsync(It.IsAny<decimal>()), Times.Never);
        _paymentRepoMock.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Never);
        _subscriptionRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Subscription>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessOverdueSubscriptionsAsync_WhenExternalServiceThrows_ShouldCaptureErrorAndContinue()
    {
        // Arrange
        var subscription = new Subscription
        {
            Id = 4,
            CustomerId = 1,
            ProviderName = "Internet",
            Category = "Utilities",
            Price = 59.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.AddDays(-1),
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetOverdueAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(new List<Subscription> { subscription });

        _externalPaymentServiceMock
            .Setup(s => s.CheckDebtAsync(subscription.Id))
            .ThrowsAsync(new HttpRequestException("Service unavailable"));

        // Act
        var result = await _sut.ProcessOverdueSubscriptionsAsync();

        // Assert
        result.CheckedCount.Should().Be(1);
        result.PaidCount.Should().Be(0);
        result.FailedCount.Should().Be(1);
        result.SkippedCount.Should().Be(0);
        result.Details.Should().Contain(d => d.Contains("Service unavailable"));

        _paymentRepoMock.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Never);
        _subscriptionRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Subscription>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessOverdueSubscriptionsAsync_WithYearlyBilling_ShouldRollNextDateByOneYear()
    {
        // Arrange
        var subscription = new Subscription
        {
            Id = 5,
            CustomerId = 3,
            ProviderName = "Cloud Storage",
            Category = "Software",
            Price = 99.99m,
            BillingCycle = BillingCycle.Yearly,
            NextPaymentDate = DateTime.UtcNow.AddDays(-1),
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetOverdueAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(new List<Subscription> { subscription });

        _externalPaymentServiceMock
            .Setup(s => s.CheckDebtAsync(subscription.Id))
            .ReturnsAsync(new CheckDebtResponse { Amount = 99.99m });

        _externalPaymentServiceMock
            .Setup(s => s.ProcessPaymentAsync(99.99m))
            .ReturnsAsync(new ProcessPaymentResponse { IsSuccess = true, TransactionId = "txn_456" });

        var expectedNextDate = subscription.NextPaymentDate.AddYears(1);

        // Act
        var result = await _sut.ProcessOverdueSubscriptionsAsync();

        // Assert
        result.CheckedCount.Should().Be(1);
        result.PaidCount.Should().Be(1);

        _subscriptionRepoMock.Verify(r => r.UpdateAsync(It.Is<Subscription>(s =>
            s.NextPaymentDate == expectedNextDate
        )), Times.Once);
    }

    [Fact]
    public async Task ProcessOverdueSubscriptionsAsync_WhenNoOverdueSubscriptions_ShouldReturnEmptyResult()
    {
        // Arrange
        _subscriptionRepoMock
            .Setup(r => r.GetOverdueAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(new List<Subscription>());

        // Act
        var result = await _sut.ProcessOverdueSubscriptionsAsync();

        // Assert
        result.CheckedCount.Should().Be(0);
        result.PaidCount.Should().Be(0);
        result.FailedCount.Should().Be(0);
        result.SkippedCount.Should().Be(0);

        _externalPaymentServiceMock.Verify(s => s.CheckDebtAsync(It.IsAny<int>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
