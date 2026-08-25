using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class HealthEndpointTests : IClassFixture<TestAppFactory>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(TestAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_endpoint_returns_ok_without_external_dependencies()
    {
        using var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"status\":\"ok\"}", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Invalid_tracking_token_returns_not_found_without_external_dependencies()
    {
        using var response = await _client.GetAsync("/api/public/orders/not-a-token/tracking");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Menu_endpoint_fails_closed_when_the_database_is_not_configured()
    {
        using var response = await _client.GetAsync("/api/public/menu");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("Supabase", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Development_frontend_origin_is_allowed_for_preflight_requests()
    {
        using var factory = new TestAppFactory()
            .WithWebHostBuilder(builder => builder.UseEnvironment("Development"));
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/health");
        request.Headers.Add("Origin", "http://localhost:4200");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        using var response = await factory.CreateClient().SendAsync(request);

        Assert.True(response.IsSuccessStatusCode);
        Assert.Equal("http://localhost:4200", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task Public_order_creation_is_rate_limited()
    {
        using var factory = new TestAppFactory();
        using var client = factory.CreateClient();
        using var content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json");

        for (var attempt = 0; attempt < 30; attempt++)
        {
            using var response = await client.PostAsync("/api/public/orders", content);
            Assert.NotEqual(HttpStatusCode.TooManyRequests, response.StatusCode);
        }

        using var limitedResponse = await client.PostAsync("/api/public/orders", new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.TooManyRequests, limitedResponse.StatusCode);
    }

    [Fact]
    public async Task Public_rating_is_rate_limited()
    {
        using var factory = new TestAppFactory().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, configuration) =>
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RateLimiting:PublicOrderRatingsPerMinute"] = "1",
                })));
        using var client = factory.CreateClient();
        var token = new string('a', 43);

        using var firstResponse = await client.PostAsync(
            $"/api/public/orders/{token}/rating",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
        using var limitedResponse = await client.PostAsync(
            $"/api/public/orders/{token}/rating",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        Assert.NotEqual(HttpStatusCode.TooManyRequests, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, limitedResponse.StatusCode);
        Assert.Equal("60", limitedResponse.Headers.RetryAfter?.Delta?.TotalSeconds.ToString("0"));
    }
}
