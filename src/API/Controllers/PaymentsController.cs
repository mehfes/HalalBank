using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HalalBank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var payments = await _paymentService.GetAllAsync();
        return Ok(payments);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var payment = await _paymentService.GetByIdAsync(id);
        if (payment is null) return NotFound();
        return Ok(payment);
    }

    [HttpGet("by-subscription/{subscriptionId}")]
    public async Task<IActionResult> GetBySubscriptionId(int subscriptionId)
    {
        var payments = await _paymentService.GetBySubscriptionIdAsync(subscriptionId);
        return Ok(payments);
    }

    [HttpPost("query-debt/{subscriptionId}")]
    public async Task<IActionResult> QueryDebt(int subscriptionId)
    {
        var debt = await _paymentService.QueryDebtAsync(subscriptionId);
        if (debt is null) return NotFound();
        return Ok(debt);
    }

    [HttpPost("pay")]
    public async Task<IActionResult> Pay([FromBody] CreatePaymentDto dto)
    {
        var payment = await _paymentService.PayAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, payment);
    }
}
