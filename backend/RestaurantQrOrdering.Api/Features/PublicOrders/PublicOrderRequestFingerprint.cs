using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public static class PublicOrderRequestFingerprint
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static byte[] Create(CreateOrderRequest request)
    {
        request = PublicOrderCanonicalizer.Canonicalize(request);
        var canonical = JsonSerializer.Serialize(new
        {
            customer_name = request.CustomerName,
            customer_whatsapp = request.CustomerWhatsapp,
            table_number = request.TableNumber,
            items = request.Items.Select(item => new
            {
                menu_item_id = item.MenuItemId,
                quantity = item.Quantity,
                notes = item.Notes,
            }),
        }, JsonOptions);

        return SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
    }
}
