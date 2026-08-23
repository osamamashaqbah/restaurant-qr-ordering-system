using System.Text.Json.Serialization;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed record StaffMember(
    Guid Id,
    string Email,
    string FullName,
    string? Role,
    DateTimeOffset CreatedAt);

public sealed class UpdateStaffRoleRequest
{
    public string Role { get; init; } = string.Empty;
}

public enum AdminCommandResult
{
    Succeeded,
    NotFound,
    NotAuthorized,
    SelfRoleChange,
    InvalidRole,
}

public sealed record SalesSummary(
    decimal Revenue,
    [property: JsonPropertyName("order_count")] int OrderCount,
    [property: JsonPropertyName("avg_order_value")] decimal AverageOrderValue,
    IReadOnlyList<DailySales> Daily,
    [property: JsonPropertyName("top_items")] IReadOnlyList<TopSellingItem> TopItems);

public sealed record DailySales(string Day, decimal Revenue);

public sealed record TopSellingItem(
    [property: JsonPropertyName("name_en")] string NameEn,
    int Quantity,
    decimal Revenue);
