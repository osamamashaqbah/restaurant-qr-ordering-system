using Npgsql;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using RestaurantQrOrdering.Api.Features.PublicMenu;
using RestaurantQrOrdering.Api.Features.PublicOrders;
using RestaurantQrOrdering.Api.Features.Staff;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
var jwtSecret = builder.Configuration["Supabase:JwtSecret"];
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
    string.IsNullOrWhiteSpace(jwtSecret)
        ? Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        : jwtSecret))
{
    KeyId = "supabase",
};
var jwtIssuer = builder.Configuration["Supabase:JwtIssuer"];
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            IssuerSigningKeyResolver = (_, _, _, _) => [signingKey],
            TryAllIssuerSigningKeys = true,
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = false,
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
var databaseConnectionString = builder.Configuration.GetConnectionString("SupabaseDatabase");
if (string.IsNullOrWhiteSpace(databaseConnectionString))
{
    builder.Services.AddSingleton<IPublicOrderStore, UnavailablePublicOrderStore>();
    builder.Services.AddSingleton<IPublicMenuStore, UnavailablePublicMenuStore>();
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
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => TypedResults.Ok(new { status = "ok" }))
    .WithName("Health")
    .WithTags("Operations");

app.Run();

public partial class Program;
