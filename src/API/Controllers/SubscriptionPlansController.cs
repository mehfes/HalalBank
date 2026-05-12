using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HalalBank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionPlansController : ControllerBase
{
    private readonly ISubscriptionPlanService _planService;

    public SubscriptionPlansController(ISubscriptionPlanService planService)
    {
        _planService = planService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var plans = await _planService.GetAllAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var plan = await _planService.GetByIdAsync(id);
        if (plan is null) return NotFound();
        return Ok(plan);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSubscriptionPlanDto dto)
    {
        var plan = await _planService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSubscriptionPlanDto dto)
    {
        await _planService.UpdateAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _planService.DeleteAsync(id);
        return NoContent();
    }
}
