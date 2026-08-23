using Npgsql;
using RestaurantQrOrdering.Api.Features.PublicOrders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
var databaseConnectionString = builder.Configuration.GetConnectionString("SupabaseDatabase");
if (string.IsNullOrWhiteSpace(databaseConnectionString))
{
    builder.Services.AddSingleton<IPublicOrderStore, UnavailablePublicOrderStore>();
}
else
{
    builder.Services.AddSingleton(NpgsqlDataSource.Create(databaseConnectionString));
    builder.Services.AddSingleton<IPublicOrderStore, NpgsqlPublicOrderStore>();
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
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => TypedResults.Ok(new { status = "ok" }))
    .WithName("Health")
    .WithTags("Operations");

app.Run();

public partial class Program;
