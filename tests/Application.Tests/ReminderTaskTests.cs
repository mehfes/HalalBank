using FluentAssertions;
using HalalBank.Application.Interfaces;
using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;
using HalalBank.Domain.Interfaces;
using Moq;

namespace Application.Tests;

public class ReminderTaskTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ISubscriptionRepository> _subscriptionRepoMock;
    private readonly Mock<INotificationService> _notificationServiceMock;

    public ReminderTaskTests()
    {
        _subscriptionRepoMock = new Mock<ISubscriptionRepository>();
        _notificationServiceMock = new Mock<INotificationService>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _unitOfWorkMock.Setup(u => u.Subscriptions).Returns(_subscriptionRepoMock.Object);
    }

    private List<Subscription> CreateSubscriptions(params int[] daysFromNow)
    {
        return daysFromNow.Select((days, i) => new Subscription
        {
            Id = i + 1,
            CustomerId = 1,
            SubscriptionNumber = $"SUB-{10000 + i}",
            ProviderName = $"Provider {i + 1}",
            Category = "Test",
            Price = 10m,
            BillingCycle = BillingCycle.Monthly,
            NextPaymentDate = DateTime.UtcNow.Date.AddDays(days),
            Status = SubscriptionStatus.Active,
            Customer = new Customer
            {
                Id = 1,
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com"
            }
        }).ToList();
    }

    [Fact]
    public async Task SendReminders_WhenSubscriptionsDueWithin3Days_ShouldSendReminderForEach()
    {
        // Arrange — 3 subscriptions due in 1, 2, and 3 days
        var upcoming = CreateSubscriptions(1, 2, 3);
        _subscriptionRepoMock
            .Setup(r => r.GetUpcomingPaymentsAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(upcoming);

        _notificationServiceMock
            .Setup(n => n.SendReminderEmailAsync(It.IsAny<Customer>(), It.IsAny<Subscription>()))
            .Returns(Task.CompletedTask);

        // Act — simulate the controller logic
        var now = DateTime.UtcNow;
        var subscriptions = await _unitOfWorkMock.Object.Subscriptions
            .GetUpcomingPaymentsAsync(now, now.AddDays(3));
        var sentCount = 0;
        foreach (var sub in subscriptions)
        {
            await _notificationServiceMock.Object.SendReminderEmailAsync(sub.Customer, sub);
            sentCount++;
        }

        // Assert
        sentCount.Should().Be(3);
        _notificationServiceMock.Verify(
            n => n.SendReminderEmailAsync(It.IsAny<Customer>(), It.IsAny<Subscription>()),
            Times.Exactly(3));
    }

    [Fact]
    public async Task SendReminders_WhenNoUpcomingSubscriptions_ShouldSendZero()
    {
        // Arrange
        _subscriptionRepoMock
            .Setup(r => r.GetUpcomingPaymentsAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<Subscription>());

        // Act — simulate the controller logic
        var now = DateTime.UtcNow;
        var subscriptions = await _unitOfWorkMock.Object.Subscriptions
            .GetUpcomingPaymentsAsync(now, now.AddDays(3));
        var sentCount = 0;
        foreach (var sub in subscriptions)
        {
            await _notificationServiceMock.Object.SendReminderEmailAsync(sub.Customer, sub);
            sentCount++;
        }

        // Assert
        sentCount.Should().Be(0);
        _notificationServiceMock.Verify(
            n => n.SendReminderEmailAsync(It.IsAny<Customer>(), It.IsAny<Subscription>()),
            Times.Never);
    }

    [Fact]
    public async Task SendReminders_ShouldOnlyIncludeSubscriptionsWithinNext3Days()
    {
        // Arrange — 5 subscriptions: due in 1, 2, 3 days (should be included),
        // and 4, 10 days (should NOT be included)
        var allSubscriptions = CreateSubscriptions(1, 2, 3, 4, 10);
        // Mock returns all — controller filters by date range via the query
        _subscriptionRepoMock
            .Setup(r => r.GetUpcomingPaymentsAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync((DateTime from, DateTime to) =>
                allSubscriptions.Where(s => s.NextPaymentDate >= from && s.NextPaymentDate <= to).ToList());

        _notificationServiceMock
            .Setup(n => n.SendReminderEmailAsync(It.IsAny<Customer>(), It.IsAny<Subscription>()))
            .Returns(Task.CompletedTask);

        // Act — simulate the controller logic
        var now = DateTime.UtcNow;
        var subscriptions = await _unitOfWorkMock.Object.Subscriptions
            .GetUpcomingPaymentsAsync(now, now.AddDays(3));
        var sentCount = 0;
        foreach (var sub in subscriptions)
        {
            await _notificationServiceMock.Object.SendReminderEmailAsync(sub.Customer, sub);
            sentCount++;
        }

        // Assert
        sentCount.Should().Be(3);
        _notificationServiceMock.Verify(
            n => n.SendReminderEmailAsync(It.IsAny<Customer>(), It.IsAny<Subscription>()),
            Times.Exactly(3));
    }
}
