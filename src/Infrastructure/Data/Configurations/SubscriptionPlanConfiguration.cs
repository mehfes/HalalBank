using HalalBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HalalBank.Infrastructure.Data.Configurations;

public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Category).IsRequired().HasMaxLength(100);
        builder.Property(p => p.DefaultPrice).HasColumnType("decimal(18,2)");
        builder.Property(p => p.DefaultBillingCycle).IsRequired().HasMaxLength(20);

        builder.HasData(
            new SubscriptionPlan { Id = 1, Name = "Netflix Premium", Category = "Streaming", DefaultPrice = 15.99m, DefaultBillingCycle = "Monthly" },
            new SubscriptionPlan { Id = 2, Name = "Spotify", Category = "Music", DefaultPrice = 9.99m, DefaultBillingCycle = "Monthly" },
            new SubscriptionPlan { Id = 3, Name = "Gym Membership", Category = "Health", DefaultPrice = 49.99m, DefaultBillingCycle = "Monthly" },
            new SubscriptionPlan { Id = 4, Name = "Internet Bill", Category = "Utilities", DefaultPrice = 59.99m, DefaultBillingCycle = "Monthly" }
        );
    }
}
