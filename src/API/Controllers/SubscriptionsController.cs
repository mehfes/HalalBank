using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HalalBank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var subscriptions = await _subscriptionService.GetAllAsync();
        return Ok(subscriptions);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var subscription = await _subscriptionService.GetByIdAsync(id);
        if (subscription is null) return NotFound();
        return Ok(subscription);
    }

    [HttpGet("by-customer/{customerId}")]
    public async Task<IActionResult> GetByCustomerId(int customerId)
    {
        var subscriptions = await _subscriptionService.GetByCustomerIdAsync(customerId);
        return Ok(subscriptions);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSubscriptionDto dto)
    {
        var subscription = await _subscriptionService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = subscription.Id }, subscription);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSubscriptionDto dto)
    {
        await _subscriptionService.UpdateAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _subscriptionService.DeleteAsync(id);
        return NoContent();
    }
}
