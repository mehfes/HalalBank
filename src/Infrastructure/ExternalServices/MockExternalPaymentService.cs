using System.Net.Http.Json;
using System.Text.Json;
using HalalBank.Application.Interfaces;

namespace HalalBank.Infrastructure.ExternalServices;

public class MockExternalPaymentService : IExternalPaymentService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public MockExternalPaymentService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<CheckDebtResponse> CheckDebtAsync(int subscriptionId)
    {
        var client = _httpClientFactory.CreateClient("MockBankApi");
        var response = await client.GetAsync($"/api/mock/debt/{subscriptionId}");
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<CheckDebtResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result ?? new CheckDebtResponse { Amount = 0 };
    }

    public async Task<ProcessPaymentResponse> ProcessPaymentAsync(decimal amount)
    {
        var client = _httpClientFactory.CreateClient("MockBankApi");
        var payload = new { amount };
        var response = await client.PostAsJsonAsync("/api/mock/payment", payload);

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ProcessPaymentResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result ?? new ProcessPaymentResponse { IsSuccess = false };
    }
}
