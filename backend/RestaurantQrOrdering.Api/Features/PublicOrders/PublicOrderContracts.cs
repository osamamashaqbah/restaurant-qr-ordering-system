using System.ComponentModel.DataAnnotations;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public sealed class CreateOrderRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string CustomerName { get; init; } = string.Empty;

    [Required]
    public string CustomerWhatsapp { get; init; } = string.Empty;

    [Required, StringLength(20, MinimumLength = 1)]
    public string TableNumber { get; init; } = string.Empty;

    [Required, MinLength(1), MaxLength(100)]
    public IReadOnlyList<CreateOrderItemRequest> Items { get; init; } = [];
}

public sealed class CreateOrderItemRequest
{
    public Guid MenuItemId { get; init; }
    public int Quantity { get; init; }
    public string? Notes { get; init; }
}

public sealed record CreateOrderResponse(string TrackingToken);

public sealed record PublicOrderTracking(
    string Status,
    decimal Total,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? ClosedAt,
    IReadOnlyList<PublicOrderItem> Items);

public sealed record PublicOrderItem(
    string NameEn,
    string NameAr,
    decimal UnitPrice,
    int Quantity);
