using HalalBank.Application.Interfaces;
using HalalBank.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HalalBank.API.Controllers;

[ApiController]
[Route("api/payment-task")]
[Authorize(Roles = "Admin")]
public class PaymentTaskController : ControllerBase
{
    private readonly IPaymentTaskService _paymentTaskService;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _unitOfWork;

    public PaymentTaskController(
        IPaymentTaskService paymentTaskService,
        INotificationService notificationService,
        IUnitOfWork unitOfWork)
    {
        _paymentTaskService = paymentTaskService;
        _notificationService = notificationService;
        _unitOfWork = unitOfWork;
    }

    [HttpPost("process-overdue")]
    public async Task<IActionResult> ProcessOverdue()
    {
        var result = await _paymentTaskService.ProcessOverdueSubscriptionsAsync(DateTime.UtcNow.AddDays(1));
        return Ok(result);
    }

    [HttpPost("process-subscription/{subscriptionId:int}")]
    public async Task<IActionResult> ProcessSubscription(int subscriptionId)
    {
        var result = await _paymentTaskService.ProcessSubscriptionPaymentAsync(subscriptionId);
        return Ok(result);
    }

    [HttpPost("send-reminders")]
    public async Task<IActionResult> SendReminders()
    {
        var now = DateTime.UtcNow;
        var upcoming = await _unitOfWork.Subscriptions.GetUpcomingPaymentsAsync(now, now.AddDays(3));
        var sentCount = 0;

        foreach (var subscription in upcoming)
        {
            await _notificationService.SendReminderEmailAsync(subscription.Customer, subscription);
            sentCount++;
        }

        return Ok(new { remindersSent = sentCount });
    }
}
