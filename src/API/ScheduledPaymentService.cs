using HalalBank.Application.Interfaces;
using HalalBank.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

public class ScheduledPaymentService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ScheduledPaymentService> _logger;

    public ScheduledPaymentService(IServiceProvider serviceProvider, ILogger<ScheduledPaymentService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ScheduledPaymentService started. Checking every 6 hours.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPaymentsAndReminders(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in scheduled payment processing");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    private async Task ProcessPaymentsAndReminders(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var paymentTaskService = scope.ServiceProvider.GetRequiredService<IPaymentTaskService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;

        // 1. Process overdue payments
        _logger.LogInformation("Running scheduled overdue payment check...");
        var paymentResult = await paymentTaskService.ProcessOverdueSubscriptionsAsync();
        _logger.LogInformation("Overdue check complete: {Checked} checked, {Paid} paid, {Failed} failed, {Skipped} skipped",
            paymentResult.CheckedCount, paymentResult.PaidCount, paymentResult.FailedCount, paymentResult.SkippedCount);

        // 2. Send reminder emails for subscriptions due within 3 days
        _logger.LogInformation("Running scheduled email reminders...");
        var upcoming = await unitOfWork.Subscriptions.GetUpcomingPaymentsAsync(now, now.AddDays(3));
        var sentCount = 0;

        foreach (var subscription in upcoming)
        {
            await notificationService.SendReminderEmailAsync(subscription.Customer, subscription);
            sentCount++;
        }

        _logger.LogInformation("Reminder emails sent: {Count}", sentCount);
    }
}
