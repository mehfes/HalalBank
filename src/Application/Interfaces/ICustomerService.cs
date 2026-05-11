using HalalBank.Application.DTOs;

namespace HalalBank.Application.Interfaces;

public interface ICustomerService
{
    Task<CustomerDto?> GetByIdAsync(int id);
    Task<IEnumerable<CustomerDto>> GetAllAsync();
    Task<CustomerDto> CreateAsync(CreateCustomerDto dto);
    Task DeleteAsync(int id);
}
