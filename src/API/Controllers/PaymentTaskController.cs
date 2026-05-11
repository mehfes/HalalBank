using HalalBank.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HalalBank.API.Controllers;

[ApiController]
[Route("api/payment-task")]
public class PaymentTaskController : ControllerBase
{
    private readonly IPaymentTaskService _paymentTaskService;

    public PaymentTaskController(IPaymentTaskService paymentTaskService)
    {
        _paymentTaskService = paymentTaskService;
    }

    [HttpPost("process-overdue")]
    public async Task<IActionResult> ProcessOverdue()
    {
        var result = await _paymentTaskService.ProcessOverdueSubscriptionsAsync();
        return Ok(result);
    }
}
