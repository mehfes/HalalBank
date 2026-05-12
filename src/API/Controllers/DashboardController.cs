using HalalBank.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HalalBank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public DashboardController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var activeCount = await _subscriptionService.GetActiveCountAsync();
        var upcomingPayments = await _subscriptionService.GetUpcomingPaymentsAsync(7);

        return Ok(new
        {
            totalActiveSubscriptions = activeCount,
            upcomingPayments
        });
    }
}
