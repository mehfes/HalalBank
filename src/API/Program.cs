using HalalBank.API.Middleware;
using HalalBank.Application.Interfaces;
using HalalBank.Application.Services;
using HalalBank.Domain.Interfaces;
using HalalBank.Infrastructure.Data;
using HalalBank.Infrastructure.ExternalServices;
using HalalBank.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

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
builder.Services.AddScoped<IAuthService, AuthService>();
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
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.MapControllers();

app.Run();
