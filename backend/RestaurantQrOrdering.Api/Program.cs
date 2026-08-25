using Npgsql;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using RestaurantQrOrdering.Api.Features.PublicMenu;
using RestaurantQrOrdering.Api.Features.PublicOrders;
using RestaurantQrOrdering.Api.Features.Staff;
using System.Net;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
var publicOrderCreateRateLimit = RequiredPositiveRateLimit(builder.Configuration, "RateLimiting:PublicOrdersPerMinute", 30);
var publicOrderTrackingRateLimit = RequiredPositiveRateLimit(builder.Configuration, "RateLimiting:PublicOrderTrackingPerMinute", 120);
var publicOrderRatingRateLimit = RequiredPositiveRateLimit(builder.Configuration, "RateLimiting:PublicOrderRatingsPerMinute", 10);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("public-order-create", context => PublicRateLimit("create", context, publicOrderCreateRateLimit));
    options.AddPolicy("public-order-track", context => PublicRateLimit("track", context, publicOrderTrackingRateLimit));
    options.AddPolicy("public-order-rating", context => PublicRateLimit("rating", context, publicOrderRatingRateLimit));
    options.OnRejected = (context, _) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "60";
        return ValueTask.CompletedTask;
    };
});
var trustedProxyAddresses = builder.Configuration.GetSection("ForwardedHeaders:TrustedProxies").Get<string[]>() ?? [];
if (trustedProxyAddresses.Length > 0)
{
    var trustedProxies = trustedProxyAddresses.Select(address =>
        IPAddress.TryParse(address, out var parsed)
            ? parsed
            : throw new InvalidOperationException($"ForwardedHeaders:TrustedProxies contains an invalid IP address: {address}"))
        .ToArray();
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.ForwardLimit = 1;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
        foreach (var proxy in trustedProxies) options.KnownProxies.Add(proxy);
    });
}
var allowedCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
{
    if (allowedCorsOrigins.Length > 0)
    {
        policy.WithOrigins(allowedCorsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    }
}));
var jwtIssuer = builder.Configuration["Supabase:JwtIssuer"];
var jwtAudience = builder.Configuration["Supabase:JwtAudience"];
if (!Uri.TryCreate(jwtIssuer, UriKind.Absolute, out var jwtIssuerUri)
    || jwtIssuerUri.Scheme != Uri.UriSchemeHttps
    || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "Supabase:JwtIssuer (HTTPS) and Supabase:JwtAudience are required for JWT validation.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.MetadataAddress = $"{jwtIssuerUri.AbsoluteUri.TrimEnd('/')}/.well-known/openid-configuration";
        options.RequireHttpsMetadata = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidIssuer = jwtIssuerUri.AbsoluteUri.TrimEnd('/'),
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(StaffPolicies.AnyStaff, policy => policy
        .RequireAuthenticatedUser()
        .AddRequirements(new StaffRoleRequirement(StaffRoles.Admin, StaffRoles.Cashier, StaffRoles.Kitchen)));
    options.AddPolicy(StaffPolicies.Admin, policy => policy
        .RequireAuthenticatedUser()
        .AddRequirements(new StaffRoleRequirement(StaffRoles.Admin)));
    options.AddPolicy(StaffPolicies.Cashier, policy => policy
        .RequireAuthenticatedUser()
        .AddRequirements(new StaffRoleRequirement(StaffRoles.Admin, StaffRoles.Cashier)));
    options.AddPolicy(StaffPolicies.Kitchen, policy => policy
        .RequireAuthenticatedUser()
        .AddRequirements(new StaffRoleRequirement(StaffRoles.Admin, StaffRoles.Kitchen)));
});
builder.Services.AddSingleton<IAuthorizationHandler, StaffRoleAuthorizationHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, StaffAuthorizationMiddlewareResultHandler>();
var databaseConnectionString = builder.Configuration.GetConnectionString("SupabaseDatabase");
if (string.IsNullOrWhiteSpace(databaseConnectionString))
{
    builder.Services.AddSingleton<IPublicOrderStore, UnavailablePublicOrderStore>();
    builder.Services.AddSingleton<IPublicMenuStore, UnavailablePublicMenuStore>();
    builder.Services.AddSingleton<IPublicRatingStore, UnavailablePublicRatingStore>();
    builder.Services.AddSingleton<IStaffProfileStore, UnavailableStaffProfileStore>();
    builder.Services.AddSingleton<IKitchenStore, UnavailableKitchenStore>();
    builder.Services.AddSingleton<ICashierStore, UnavailableCashierStore>();
    builder.Services.AddSingleton<IAdminStore, UnavailableAdminStore>();
    builder.Services.AddSingleton<IAdminMenuStore, UnavailableAdminMenuStore>();
}
else
{
    builder.Services.AddSingleton(NpgsqlDataSource.Create(databaseConnectionString));
    builder.Services.AddSingleton<IPublicOrderStore, NpgsqlPublicOrderStore>();
    builder.Services.AddSingleton<IPublicMenuStore, NpgsqlPublicMenuStore>();
    builder.Services.AddSingleton<IPublicRatingStore, NpgsqlPublicRatingStore>();
    builder.Services.AddSingleton<IStaffProfileStore, NpgsqlStaffProfileStore>();
    builder.Services.AddSingleton<IKitchenStore, NpgsqlKitchenStore>();
    builder.Services.AddSingleton<ICashierStore, NpgsqlCashierStore>();
    builder.Services.AddSingleton<IAdminStore, NpgsqlAdminStore>();
    builder.Services.AddSingleton<IAdminMenuStore, NpgsqlAdminMenuStore>();
}
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();
if (trustedProxyAddresses.Length > 0)
    app.UseForwardedHeaders();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => TypedResults.Ok(new { status = "ok" }))
    .WithName("Health")
    .WithTags("Operations");

app.Run();

static int RequiredPositiveRateLimit(IConfiguration configuration, string key, int defaultValue)
{
    var value = configuration.GetValue<int?>(key) ?? defaultValue;
    return value > 0
        ? value
        : throw new InvalidOperationException($"{key} must be a positive integer.");
}

static RateLimitPartition<string> PublicRateLimit(string operation, HttpContext context, int permitLimit) =>
    RateLimitPartition.GetFixedWindowLimiter(
        $"{operation}:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true,
        });

public partial class Program;
