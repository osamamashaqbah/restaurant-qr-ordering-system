using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class TestAppFactory : WebApplicationFactory<Program>
{
    public const string JwtIssuer = "https://test.supabase.co/auth/v1";
    public const string JwtAudience = "authenticated";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Supabase:JwtIssuer", JwtIssuer);
        builder.UseSetting("Supabase:JwtAudience", JwtAudience);
    }
}
