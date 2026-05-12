using HalalBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HalalBank.Infrastructure.Data.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.LastName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Password).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Role).IsRequired().HasMaxLength(20);

        var adminHash = BCrypt.Net.BCrypt.HashPassword("admin123");
        var userHash = BCrypt.Net.BCrypt.HashPassword("password123");

        builder.HasData(
            new Customer { Id = 1, FirstName = "John", LastName = "Doe", Email = "john.doe@email.com", Password = userHash, Role = "Customer", CreatedDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Customer { Id = 2, FirstName = "Jane", LastName = "Smith", Email = "jane.smith@email.com", Password = userHash, Role = "Customer", CreatedDate = new DateTime(2026, 2, 20, 0, 0, 0, DateTimeKind.Utc) },
            new Customer { Id = 3, FirstName = "Bob", LastName = "Wilson", Email = "bob.wilson@email.com", Password = userHash, Role = "Customer", CreatedDate = new DateTime(2026, 3, 10, 0, 0, 0, DateTimeKind.Utc) },
            new Customer { Id = 4, FirstName = "Admin", LastName = "User", Email = "admin@test.com", Password = adminHash, Role = "Admin", CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}
