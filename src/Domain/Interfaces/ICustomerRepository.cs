using HalalBank.Domain.Entities;

namespace HalalBank.Domain.Interfaces;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(int id);
    Task<IEnumerable<Customer>> GetAllAsync();
    Task<Customer?> GetByEmailAsync(string email);
    Task<Customer> AddAsync(Customer customer);
    Task DeleteAsync(Customer customer);
}
