using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class TestAppFactory : WebApplicationFactory<Program>
{
    public const string JwtIssuer = "https://test.supabase.co/auth/v1";
    public const string JwtAudience = "authenticated";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Supabase:JwtIssuer"] = JwtIssuer,
                ["Supabase:JwtAudience"] = JwtAudience,
            }));
    }
}
