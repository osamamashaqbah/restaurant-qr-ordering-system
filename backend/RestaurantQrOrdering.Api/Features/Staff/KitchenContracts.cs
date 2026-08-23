namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed record KitchenOrder(
    Guid Id,
    string TableNumber,
    string Status,
    DateTimeOffset CreatedAt,
    IReadOnlyList<KitchenOrderItem> Items);

public sealed record KitchenOrderItem(Guid Id, string NameEn, int Quantity, string Notes);

public enum KitchenCommandResult
{
    Succeeded,
    NotFound,
    InvalidTransition,
    NotAuthorized,
}
