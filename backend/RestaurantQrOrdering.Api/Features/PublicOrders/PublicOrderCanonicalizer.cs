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
            .GroupBy(item => item.MenuItemId)
            .OrderBy(group => group.Key)
            .Select(group => new CreateOrderItemRequest
            {
                MenuItemId = group.Key,
                Quantity = group.Sum(item => item.Quantity),
                Notes = group.First().Notes,
            })
            .ToArray(),
    };
}
