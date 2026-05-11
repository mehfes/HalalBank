using HalalBank.Application.DTOs;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Mappers;
using HalalBank.Domain.Interfaces;

namespace HalalBank.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;

    public AuthService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var customer = await _unitOfWork.Customers.GetByEmailAsync(dto.Email);
        if (customer is null)
            throw new InvalidOperationException("Invalid email or password.");

        if (customer.Password != dto.Password)
            throw new InvalidOperationException("Invalid email or password.");

        return new AuthResponseDto
        {
            Id = customer.Id,
            Email = customer.Email,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Role = "Customer"
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(CreateCustomerDto dto)
    {
        var existing = await _unitOfWork.Customers.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Email already registered.");

        var customer = dto.ToEntity();
        var created = await _unitOfWork.Customers.AddAsync(customer);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            Id = created.Id,
            Email = created.Email,
            FirstName = created.FirstName,
            LastName = created.LastName,
            Role = "Customer"
        };
    }
}
