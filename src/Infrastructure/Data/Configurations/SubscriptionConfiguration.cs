using HalalBank.Domain.Entities;
using HalalBank.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HalalBank.Infrastructure.Data.Configurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.SubscriptionNumber).IsRequired().HasMaxLength(50);
        builder.Property(s => s.ProviderName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Category).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Price).HasColumnType("decimal(18,2)");
        builder.Property(s => s.BillingCycle).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(s => s.Customer)
            .WithMany(c => c.Subscriptions)
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasData(
            new Subscription { Id = 1, CustomerId = 1, SubscriptionNumber = "SUB-48291", ProviderName = "Netflix", Category = "Streaming", Price = 15.99m, BillingCycle = BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc), Status = SubscriptionStatus.Active },
            new Subscription { Id = 2, CustomerId = 1, SubscriptionNumber = "SUB-73518", ProviderName = "Spotify", Category = "Music", Price = 9.99m, BillingCycle = BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc), Status = SubscriptionStatus.Active },
            new Subscription { Id = 3, CustomerId = 2, SubscriptionNumber = "SUB-20946", ProviderName = "Electricity Bill", Category = "Utilities", Price = 120.00m, BillingCycle = BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 11, 0, 0, 0, DateTimeKind.Utc), Status = SubscriptionStatus.Active },
            new Subscription { Id = 4, CustomerId = 2, SubscriptionNumber = "SUB-66831", ProviderName = "Internet", Category = "Utilities", Price = 59.99m, BillingCycle = BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 11, 0, 0, 0, DateTimeKind.Utc), Status = SubscriptionStatus.Active },
            new Subscription { Id = 5, CustomerId = 3, SubscriptionNumber = "SUB-11387", ProviderName = "Cloud Storage", Category = "Software", Price = 99.99m, BillingCycle = BillingCycle.Yearly, NextPaymentDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc), Status = SubscriptionStatus.Active }
        );
    }
}
