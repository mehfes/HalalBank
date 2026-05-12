using FluentAssertions;
using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Services;
using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;
using HalalBank.Domain.Interfaces;
using Moq;

namespace Application.Tests;

public class SubscriptionServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ISubscriptionRepository> _subscriptionRepoMock;
    private readonly Mock<ICustomerRepository> _customerRepoMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly SubscriptionService _sut;

    public SubscriptionServiceTests()
    {
        _subscriptionRepoMock = new Mock<ISubscriptionRepository>();
        _customerRepoMock = new Mock<ICustomerRepository>();
        _notificationServiceMock = new Mock<INotificationService>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _unitOfWorkMock.Setup(u => u.Subscriptions).Returns(_subscriptionRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Customers).Returns(_customerRepoMock.Object);
        _sut = new SubscriptionService(_unitOfWorkMock.Object, _notificationServiceMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WhenSubscriptionNumberNotProvided_ShouldGenerateRandomNumber()
    {
        var dto = new CreateSubscriptionDto
        {
            CustomerId = 1,
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = "Monthly",
            NextPaymentDate = DateTime.UtcNow.AddDays(30)
        };

        Subscription captured = null!;
        _subscriptionRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Subscription>()))
            .Callback<Subscription>(s => captured = s)
            .ReturnsAsync((Subscription s) => s);

        // Act
        await _sut.CreateAsync(dto);

        // Assert
        captured.Should().NotBeNull();
        captured.SubscriptionNumber.Should().NotBeNullOrWhiteSpace();
        captured.SubscriptionNumber.Should().Match("SUB-?????");
    }

    [Fact]
    public async Task CreateAsync_WhenSubscriptionNumberProvided_ShouldPreserveIt()
    {
        var dto = new CreateSubscriptionDto
        {
            CustomerId = 1,
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = "Monthly",
            NextPaymentDate = DateTime.UtcNow.AddDays(30),
            SubscriptionNumber = "SUB-99999"
        };

        Subscription captured = null!;
        _subscriptionRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Subscription>()))
            .Callback<Subscription>(s => captured = s)
            .ReturnsAsync((Subscription s) => s);

        // Act
        await _sut.CreateAsync(dto);

        // Assert
        captured.SubscriptionNumber.Should().Be("SUB-99999");
    }

    [Fact]
    public async Task UpdateAsync_WhenStatusChanges_ShouldSendStatusChangeEmail()
    {
        var subscription = new Subscription
        {
            Id = 1,
            CustomerId = 1,
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.AddDays(1),
            Status = SubscriptionStatus.Active
        };

        var customer = new Customer
        {
            Id = 1,
            FirstName = "John",
            LastName = "Doe",
            Email = "john@test.com"
        };

        _subscriptionRepoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(subscription);

        _customerRepoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(customer);

        var dto = new UpdateSubscriptionDto { Status = "Passive" };

        await _sut.UpdateAsync(1, dto);

        _notificationServiceMock.Verify(
            n => n.SendStatusChangeEmailAsync(customer, subscription, "Active", "Passive"),
            Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenStatusNotChanged_ShouldNotSendStatusChangeEmail()
    {
        var subscription = new Subscription
        {
            Id = 1,
            CustomerId = 1,
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.AddDays(1),
            Status = SubscriptionStatus.Active
        };

        _subscriptionRepoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(subscription);

        var dto = new UpdateSubscriptionDto { Price = 19.99m };

        await _sut.UpdateAsync(1, dto);

        _notificationServiceMock.Verify(
            n => n.SendStatusChangeEmailAsync(It.IsAny<Customer>(), It.IsAny<Subscription>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }
}
