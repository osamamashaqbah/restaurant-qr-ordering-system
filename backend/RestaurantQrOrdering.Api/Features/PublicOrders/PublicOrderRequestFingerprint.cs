using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public static class PublicOrderRequestFingerprint
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static byte[] Create(CreateOrderRequest request)
    {
        var canonical = JsonSerializer.Serialize(new
        {
            customer_name = request.CustomerName.Trim(),
            customer_whatsapp = request.CustomerWhatsapp.Trim(),
            table_number = request.TableNumber.Trim(),
            items = request.Items.Select(item => new
            {
                menu_item_id = item.MenuItemId,
                quantity = item.Quantity,
                notes = item.Notes ?? string.Empty,
            }),
        }, JsonOptions);

        return SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
    }
}
