namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public static class PublicOrderCanonicalizer
{
    public static CreateOrderRequest Canonicalize(CreateOrderRequest request) => new()
    {
        CustomerName = request.CustomerName.Trim(),
        CustomerWhatsapp = request.CustomerWhatsapp.Trim(),
        TableNumber = request.TableNumber.Trim(),
        Items = request.Items
            .Select(item => new { item.MenuItemId, item.Quantity, Notes = item.Notes?.Trim() ?? string.Empty })
            .GroupBy(item => new { item.MenuItemId, item.Notes })
            .OrderBy(group => group.Key.MenuItemId)
            .ThenBy(group => group.Key.Notes, StringComparer.Ordinal)
            .Select(group => new CreateOrderItemRequest
            {
                MenuItemId = group.Key.MenuItemId,
                Quantity = group.Sum(item => item.Quantity),
                Notes = group.Key.Notes,
            })
            .ToArray(),
    };
}
