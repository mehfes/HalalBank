using System.Text;
using HalalBank.API.Middleware;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Services;
using HalalBank.Domain.Interfaces;
using HalalBank.Infrastructure.Data;
using HalalBank.Infrastructure.ExternalServices;
using HalalBank.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var jwtKey = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? "HalalBankSuperSecretKey2026!@#$%^&*()AtLeast32Chars";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "HalalBank";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "HalalBank";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddScoped<HalalBank.API.Services.JwtService>();

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string? connectionString;

if (!string.IsNullOrEmpty(databaseUrl))
{
    if (databaseUrl.StartsWith("postgres://") || databaseUrl.StartsWith("postgresql://"))
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
    }
    else
    {
        connectionString = databaseUrl;
    }
}
else
{
    var pgHost = Environment.GetEnvironmentVariable("PGHOST");
    if (!string.IsNullOrEmpty(pgHost))
    {
        var pgPort = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
        var pgDb = Environment.GetEnvironmentVariable("PGDATABASE") ?? "railway";
        var pgUser = Environment.GetEnvironmentVariable("PGUSER") ?? "postgres";
        var pgPass = Environment.GetEnvironmentVariable("PGPASSWORD") ?? "";
        connectionString = $"Host={pgHost};Port={pgPort};Database={pgDb};Username={pgUser};Password={pgPass};SSL Mode=Require;Trust Server Certificate=true;";
    }
    else
    {
        connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    }
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions => npgsqlOptions.EnableRetryOnFailure()));

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IPaymentGateway, MockPaymentGateway>();
builder.Services.AddScoped<IExternalPaymentService, MockExternalPaymentService>();
builder.Services.AddScoped<IPaymentTaskService, PaymentTaskService>();
builder.Services.AddScoped<INotificationService, EmailNotificationService>();
builder.Services.AddScoped<ISubscriptionPlanService, SubscriptionPlanService>();
var googleClientId = builder.Configuration["GoogleAuth:ClientId"] ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? "";
builder.Services.AddScoped<IAuthService>(_ => new AuthService(_.GetRequiredService<IUnitOfWork>(), googleClientId, _.GetRequiredService<INotificationService>()));
builder.Services.AddHostedService<ScheduledPaymentService>();
builder.Services.AddHttpClient("MockBankApi", client =>
    client.BaseAddress = new Uri("http://mockbank.local"))
    .ConfigurePrimaryHttpMessageHandler(() => new MockBankMessageHandler());

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    if (!db.Customers.Any())
    {
        var userHash = BCrypt.Net.BCrypt.HashPassword("password123");
        var adminHash = BCrypt.Net.BCrypt.HashPassword("admin123");
        db.Customers.AddRange(
            new HalalBank.Domain.Entities.Customer { Id = 1, FirstName = "John", LastName = "Doe", Email = "john.doe@email.com", Password = userHash, Role = "Customer", CreatedDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc) },
            new HalalBank.Domain.Entities.Customer { Id = 2, FirstName = "Jane", LastName = "Smith", Email = "jane.smith@email.com", Password = userHash, Role = "Customer", CreatedDate = new DateTime(2026, 2, 20, 0, 0, 0, DateTimeKind.Utc) },
            new HalalBank.Domain.Entities.Customer { Id = 3, FirstName = "Bob", LastName = "Wilson", Email = "bob.wilson@email.com", Password = userHash, Role = "Customer", CreatedDate = new DateTime(2026, 3, 10, 0, 0, 0, DateTimeKind.Utc) },
            new HalalBank.Domain.Entities.Customer { Id = 4, FirstName = "Admin", LastName = "User", Email = "admin@test.com", Password = adminHash, Role = "Admin", CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        db.SubscriptionPlans.AddRange(
            new HalalBank.Domain.Entities.SubscriptionPlan { Id = 1, Name = "Netflix Premium", Category = "Streaming", DefaultPrice = 15.99m, DefaultBillingCycle = "Monthly" },
            new HalalBank.Domain.Entities.SubscriptionPlan { Id = 2, Name = "Spotify", Category = "Music", DefaultPrice = 9.99m, DefaultBillingCycle = "Monthly" },
            new HalalBank.Domain.Entities.SubscriptionPlan { Id = 3, Name = "Gym Membership", Category = "Health", DefaultPrice = 49.99m, DefaultBillingCycle = "Monthly" },
            new HalalBank.Domain.Entities.SubscriptionPlan { Id = 4, Name = "Internet Bill", Category = "Utilities", DefaultPrice = 59.99m, DefaultBillingCycle = "Monthly" }
        );
        db.Subscriptions.AddRange(
            new HalalBank.Domain.Entities.Subscription { Id = 1, CustomerId = 1, SubscriptionNumber = "SUB-48291", ProviderName = "Netflix", Category = "Streaming", SubscriptionType = HalalBank.Domain.Enums.SubscriptionType.Streaming, Price = 15.99m, BillingCycle = HalalBank.Domain.Enums.BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc), Status = HalalBank.Domain.Enums.SubscriptionStatus.Active },
            new HalalBank.Domain.Entities.Subscription { Id = 2, CustomerId = 1, SubscriptionNumber = "SUB-73518", ProviderName = "Spotify", Category = "Music", SubscriptionType = HalalBank.Domain.Enums.SubscriptionType.Music, Price = 9.99m, BillingCycle = HalalBank.Domain.Enums.BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc), Status = HalalBank.Domain.Enums.SubscriptionStatus.Active },
            new HalalBank.Domain.Entities.Subscription { Id = 3, CustomerId = 2, SubscriptionNumber = "SUB-20946", ProviderName = "Electricity Bill", Category = "Utilities", SubscriptionType = HalalBank.Domain.Enums.SubscriptionType.Electricity, Price = 120.00m, BillingCycle = HalalBank.Domain.Enums.BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 11, 0, 0, 0, DateTimeKind.Utc), Status = HalalBank.Domain.Enums.SubscriptionStatus.Active },
            new HalalBank.Domain.Entities.Subscription { Id = 4, CustomerId = 2, SubscriptionNumber = "SUB-66831", ProviderName = "Internet", Category = "Utilities", SubscriptionType = HalalBank.Domain.Enums.SubscriptionType.Internet, Price = 59.99m, BillingCycle = HalalBank.Domain.Enums.BillingCycle.Monthly, NextPaymentDate = new DateTime(2026, 5, 11, 0, 0, 0, DateTimeKind.Utc), Status = HalalBank.Domain.Enums.SubscriptionStatus.Active },
            new HalalBank.Domain.Entities.Subscription { Id = 5, CustomerId = 3, SubscriptionNumber = "SUB-11387", ProviderName = "Cloud Storage", Category = "Software", SubscriptionType = HalalBank.Domain.Enums.SubscriptionType.Software, Price = 99.99m, BillingCycle = HalalBank.Domain.Enums.BillingCycle.Yearly, NextPaymentDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc), Status = HalalBank.Domain.Enums.SubscriptionStatus.Active }
        );
        await db.SaveChangesAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
