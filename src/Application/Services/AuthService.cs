using Google.Apis.Auth;
using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Mappers;
using HalalBank.Domain.Interfaces;

namespace HalalBank.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly string _googleClientId;
    private readonly INotificationService _notificationService;

    public AuthService(IUnitOfWork unitOfWork, string googleClientId, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _googleClientId = googleClientId;
        _notificationService = notificationService;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var customer = await _unitOfWork.Customers.GetByEmailAsync(dto.Email);
        if (customer is null)
            throw new InvalidOperationException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, customer.Password))
            throw new InvalidOperationException("Invalid email or password.");

        return new AuthResponseDto
        {
            Id = customer.Id,
            Email = customer.Email,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Role = customer.Role
        };
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { _googleClientId }
        };
        var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);

        var customer = await _unitOfWork.Customers.GetByEmailAsync(payload.Email);
        if (customer is null)
        {
            var nameParts = (payload.Name ?? payload.Email).Split(' ', 2);
            customer = new Domain.Entities.Customer
            {
                FirstName = nameParts[0],
                LastName = nameParts.Length > 1 ? nameParts[1] : "",
                Email = payload.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                CreatedDate = DateTime.UtcNow
            };
            await _unitOfWork.Customers.AddAsync(customer);
            await _unitOfWork.SaveChangesAsync();
        }

        return new AuthResponseDto
        {
            Id = customer.Id,
            Email = customer.Email,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Role = customer.Role
        };
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequestDto dto)
    {
        var customer = await _unitOfWork.Customers.GetByEmailAsync(dto.Email);
        if (customer is null)
            throw new InvalidOperationException("If this email is registered, a reset link has been sent.");

        var tempPassword = Guid.NewGuid().ToString("N")[..8];
        customer.Password = BCrypt.Net.BCrypt.HashPassword(tempPassword);
        await _unitOfWork.SaveChangesAsync();

        var subject = "HalalBank — Password Reset";
        var body = $@"
<html>
<body style='font-family: Arial, sans-serif; padding: 20px;'>
    <h2 style='color: #059669;'>HalalBank Password Reset</h2>
    <p>Dear <strong>{customer.FirstName} {customer.LastName}</strong>,</p>
    <p>Your password has been reset as requested.</p>
    <p>Your temporary password is:</p>
    <div style='background: #f3f4f6; padding: 12px 20px; border-radius: 8px; font-size: 18px; font-family: monospace; text-align: center; margin: 16px 0;'>
        {tempPassword}
    </div>
    <p>Please use this password to sign in, then change it from your account settings.</p>
    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'/>
    <p style='color: #888; font-size: 12px;'>This is an automated message from HalalBank. If you did not request this, please ignore this email.</p>
</body>
</html>";

        await _notificationService.SendEmailAsync(customer.Email, $"{customer.FirstName} {customer.LastName}", subject, body);
    }

    public async Task<AuthResponseDto> RegisterAsync(CreateCustomerDto dto)
    {
        var existing = await _unitOfWork.Customers.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Email already registered.");

        var customer = dto.ToEntity();
        customer.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var created = await _unitOfWork.Customers.AddAsync(customer);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            Id = created.Id,
            Email = created.Email,
            FirstName = created.FirstName,
            LastName = created.LastName,
            Role = created.Role
        };
    }
}
