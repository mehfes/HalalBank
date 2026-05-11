using System.Net;
using System.Text.Json;

namespace HalalBank.Infrastructure.ExternalServices;

public class MockBankMessageHandler : HttpMessageHandler
{
    private static readonly Random _random = new();

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        await Task.Delay(1000, cancellationToken);

        if (request.RequestUri?.AbsolutePath.Contains("/debt", StringComparison.OrdinalIgnoreCase) == true)
        {
            var segments = request.RequestUri.AbsolutePath.TrimEnd('/').Split('/');
            var amount = segments.Length >= 4 && decimal.TryParse(segments[^1], out var parsed) ? parsed : 0m;
            var debtResponse = new { amount };
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(debtResponse), System.Text.Encoding.UTF8, "application/json")
            };
        }

        if (request.RequestUri?.AbsolutePath.Contains("/payment", StringComparison.OrdinalIgnoreCase) == true)
        {
            var isSuccess = _random.NextDouble() < 0.8;
            var paymentResponse = new
            {
                isSuccess,
                transactionId = isSuccess ? Guid.NewGuid().ToString("N") : null
            };
            return new HttpResponseMessage(isSuccess ? HttpStatusCode.OK : HttpStatusCode.BadGateway)
            {
                Content = new StringContent(JsonSerializer.Serialize(paymentResponse), System.Text.Encoding.UTF8, "application/json")
            };
        }

        return new HttpResponseMessage(HttpStatusCode.NotFound);
    }
}
