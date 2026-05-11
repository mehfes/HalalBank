using FluentAssertions;
using HalalBank.Application.DTOs;
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
    private readonly SubscriptionService _sut;

    public SubscriptionServiceTests()
    {
        _subscriptionRepoMock = new Mock<ISubscriptionRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _unitOfWorkMock.Setup(u => u.Subscriptions).Returns(_subscriptionRepoMock.Object);
        _sut = new SubscriptionService(_unitOfWorkMock.Object);
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
}
