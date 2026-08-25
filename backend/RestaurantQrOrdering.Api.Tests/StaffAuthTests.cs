using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using RestaurantQrOrdering.Api.Features.Staff;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class StaffAuthTests
{
    private const string JwtIssuer = TestAppFactory.JwtIssuer;
    private const string JwtAudience = TestAppFactory.JwtAudience;
    private static readonly ECDsa SigningAlgorithm = ECDsa.Create(ECCurve.NamedCurves.nistP256);

    [Fact]
    public async Task Staff_identity_requires_a_bearer_token()
    {
        using var app = CreateApp(new FakeStaffProfileStore(null));
        using var client = app.CreateClient();

        using var response = await client.GetAsync("/api/staff/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Staff_identity_returns_only_role_and_name_for_a_valid_profile()
    {
        var userId = Guid.NewGuid();
        using var app = CreateApp(new FakeStaffProfileStore(new StaffProfile(userId, StaffRoles.Admin, "Ada")));
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(userId));

        using var response = await client.GetAsync("/api/staff/me");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"role\":\"admin\",\"fullName\":\"Ada\"}", body);
        Assert.DoesNotContain(userId.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("email", body, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task Staff_identity_forbids_a_profile_without_a_known_role()
    {
        var userId = Guid.NewGuid();
        using var app = CreateApp(new FakeStaffProfileStore(new StaffProfile(userId, null, "Pending")));
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(userId));

        using var response = await client.GetAsync("/api/staff/me");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Staff_identity_fails_closed_when_the_profile_store_is_unavailable()
    {
        using var app = CreateApp(new UnavailableStaffProfileStore());
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(Guid.NewGuid()));

        using var response = await client.GetAsync("/api/staff/me");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("Supabase", await response.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Staff_policy_returns_service_unavailable_when_the_profile_store_is_unavailable()
    {
        using var app = CreateApp(new UnavailableStaffProfileStore());
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(Guid.NewGuid()));

        using var response = await client.GetAsync("/api/staff/admin/staff");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("Supabase", await response.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Staff_identity_rejects_a_token_signed_with_a_different_key()
    {
        using var app = CreateApp(new FakeStaffProfileStore(new StaffProfile(Guid.NewGuid(), StaffRoles.Admin, "Ada")));
        using var client = app.CreateClient();
        using var untrustedSigningAlgorithm = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(Guid.NewGuid(), untrustedSigningAlgorithm));

        using var response = await client.GetAsync("/api/staff/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Staff_identity_rejects_a_token_for_a_different_audience()
    {
        using var app = CreateApp(new FakeStaffProfileStore(new StaffProfile(Guid.NewGuid(), StaffRoles.Admin, "Ada")));
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(Guid.NewGuid(), audience: "service_role"));

        using var response = await client.GetAsync("/api/staff/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public void Application_requires_the_Supabase_JWT_configuration()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, configuration) => configuration.Sources.Clear()));

        var exception = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());

        Assert.Contains("Supabase:JwtIssuer", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Admin_policy_does_not_grant_access_to_a_cashier()
    {
        var userId = Guid.NewGuid();
        var handler = new StaffRoleAuthorizationHandler(
            new FakeStaffProfileStore(new StaffProfile(userId, StaffRoles.Cashier, "Cashier")));
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(JwtRegisteredClaimNames.Sub, userId.ToString())],
            "test"));
        var context = new AuthorizationHandlerContext(
            [new StaffRoleRequirement(StaffRoles.Admin)],
            user,
            null);

        await handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    private static WebApplicationFactory<Program> CreateApp(IStaffProfileStore profileStore) =>
        new TestAppFactory().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Supabase:JwtIssuer", JwtIssuer);
            builder.UseSetting("Supabase:JwtAudience", JwtAudience);
            builder.ConfigureAppConfiguration((_, configuration) =>
            {
                configuration.Sources.Clear();
                configuration.AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["Supabase:JwtIssuer"] = JwtIssuer,
                        ["Supabase:JwtAudience"] = JwtAudience,
                    });
            });
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IStaffProfileStore>();
                services.AddSingleton(profileStore);
                services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    var configuration = new OpenIdConnectConfiguration { Issuer = JwtIssuer };
                    configuration.SigningKeys.Add(new ECDsaSecurityKey(
                        ECDsa.Create(SigningAlgorithm.ExportParameters(false))) { KeyId = "test-key" });
                    options.Configuration = configuration;
                });
            });
        });

    private static string CreateToken(Guid userId, ECDsa? signingAlgorithm = null, string audience = JwtAudience)
    {
        var credentials = new SigningCredentials(
            new ECDsaSecurityKey(signingAlgorithm ?? SigningAlgorithm) { KeyId = "test-key" },
            SecurityAlgorithms.EcdsaSha256);
        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: audience,
            claims: [new Claim(JwtRegisteredClaimNames.Sub, userId.ToString())],
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private sealed class FakeStaffProfileStore(StaffProfile? profile) : IStaffProfileStore
    {
        public Task<StaffProfile?> GetAsync(Guid userId, CancellationToken cancellationToken) =>
            Task.FromResult(profile is null || profile.UserId == userId ? profile : null);
    }
}
