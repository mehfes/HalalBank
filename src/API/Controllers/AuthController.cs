using HalalBank.API.Services;
using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HalalBank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly JwtService _jwtService;

    public AuthController(IAuthService authService, JwtService jwtService)
    {
        _authService = authService;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        result.Token = _jwtService.GenerateToken(result.Id, result.Email, result.Role);
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CreateCustomerDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        result.Token = _jwtService.GenerateToken(result.Id, result.Email, result.Role);
        return CreatedAtAction(nameof(Login), result);
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
        var result = await _authService.GoogleLoginAsync(dto);
        result.Token = _jwtService.GenerateToken(result.Id, result.Email, result.Role);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
        await _authService.ForgotPasswordAsync(dto);
        return Ok(new { message = "If this email is registered, a password reset link has been sent." });
    }
}
