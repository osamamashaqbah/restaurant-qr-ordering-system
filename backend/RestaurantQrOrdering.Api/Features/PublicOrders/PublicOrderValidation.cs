using System.Text.RegularExpressions;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public static partial class PublicOrderValidation
{
    [GeneratedRegex(@"^\+?[0-9]{7,15}$")]
    private static partial Regex E164Number();

    public static Dictionary<string, string[]> Validate(CreateOrderRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.CustomerName) || request.CustomerName.Trim().Length > 100)
            errors[nameof(request.CustomerName)] = ["Customer name must be between 1 and 100 characters."];

        if (!E164Number().IsMatch(request.CustomerWhatsapp.Trim()))
            errors[nameof(request.CustomerWhatsapp)] = ["Customer WhatsApp must be a 7-15 digit international number."];

        if (string.IsNullOrWhiteSpace(request.TableNumber) || request.TableNumber.Trim().Length > 20)
            errors[nameof(request.TableNumber)] = ["Table number must be between 1 and 20 characters."];

        if (request.Items is null || request.Items.Count is < 1 or > 100)
            errors[nameof(request.Items)] = ["An order must contain between 1 and 100 items."];
        else
        {
            for (var index = 0; index < request.Items.Count; index++)
            {
                var item = request.Items[index];
                if (item.MenuItemId == Guid.Empty || item.Quantity is < 1 or > 50)
                    errors[$"Items[{index}]"] = ["Each item needs a valid menu item id and quantity between 1 and 50."];

                if ((item.Notes?.Length ?? 0) > 300)
                    errors[$"Items[{index}].Notes"] = ["Item notes cannot exceed 300 characters."];
            }
        }

        return errors;
    }
}
