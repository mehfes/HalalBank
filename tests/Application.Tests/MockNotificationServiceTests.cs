using FluentAssertions;
using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;
using HalalBank.Infrastructure.ExternalServices;
using Microsoft.Extensions.Logging;
using Moq;

namespace Application.Tests;

public class MockNotificationServiceTests
{
    [Fact]
    public async Task SendReminderEmailAsync_ShouldNotThrow()
    {
        var loggerMock = new Mock<ILogger<MockNotificationService>>();
        var sut = new MockNotificationService(loggerMock.Object);
        var customer = new Customer
        {
            Id = 1,
            FirstName = "John",
            LastName = "Doe",
            Email = "john@test.com"
        };
        var subscription = new Subscription
        {
            Id = 1,
            CustomerId = 1,
            SubscriptionNumber = "SUB-12345",
            ProviderName = "Netflix",
            Category = "Streaming",
            Price = 15.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.AddDays(2),
            Status = SubscriptionStatus.Active
        };

        // Act
        var act = () => sut.SendReminderEmailAsync(customer, subscription);

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SendReminderEmailAsync_ShouldLogInformation()
    {
        var loggerMock = new Mock<ILogger<MockNotificationService>>();
        var sut = new MockNotificationService(loggerMock.Object);
        var customer = new Customer
        {
            Id = 1,
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane@test.com"
        };
        var subscription = new Subscription
        {
            Id = 2,
            CustomerId = 1,
            SubscriptionNumber = "SUB-99999",
            ProviderName = "Spotify",
            Category = "Music",
            Price = 9.99m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.AddDays(3),
            Status = SubscriptionStatus.Active
        };

        // Act
        await sut.SendReminderEmailAsync(customer, subscription);

        // Assert
        loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }
}
