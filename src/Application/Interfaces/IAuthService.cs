using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
    Task<AuthResponseDto> RegisterAsync(CreateCustomerDto dto);
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto);
    Task ForgotPasswordAsync(ForgotPasswordRequestDto dto);
}
