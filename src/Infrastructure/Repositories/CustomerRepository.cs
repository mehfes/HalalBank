using HalalBank.Domain.Entities;
using HalalBank.Domain.Interfaces;
using HalalBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HalalBank.Infrastructure.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _context;

    public CustomerRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Customer?> GetByIdAsync(int id) =>
        await _context.Customers.FindAsync(id);

    public async Task<IEnumerable<Customer>> GetAllAsync() =>
        await _context.Customers.ToListAsync();

    public async Task<Customer> AddAsync(Customer customer)
    {
        await _context.Customers.AddAsync(customer);
        return customer;
    }

    public Task DeleteAsync(Customer customer)
    {
        _context.Customers.Remove(customer);
        return Task.CompletedTask;
    }
}
