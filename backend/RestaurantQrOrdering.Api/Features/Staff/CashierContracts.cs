namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed record CashierOrder(
    Guid Id,
    string TableNumber,
    string Status,
    string CustomerName,
    string CustomerWhatsapp,
    decimal Total,
    DateTimeOffset CreatedAt,
    IReadOnlyList<CashierOrderItem> Items);

public sealed record CashierOrderItem(Guid Id, string NameEn, int Quantity, decimal UnitPrice);

public enum CashierCommandResult
{
    Succeeded,
    NotFound,
    InvalidTransition,
    NotAuthorized,
}
