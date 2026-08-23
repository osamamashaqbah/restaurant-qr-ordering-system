using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
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
}
