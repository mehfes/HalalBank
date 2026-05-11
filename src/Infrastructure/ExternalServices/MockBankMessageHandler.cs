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
            var amount = _random.Next(3) == 0 ? 0 : Math.Round((decimal)(_random.NextDouble() * 1000 + 50), 2);
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
