using System.Security.Cryptography;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public sealed record TrackingToken(string Value, byte[] Hash)
{
    public static TrackingToken Create()
    {
        var raw = RandomNumberGenerator.GetBytes(32);
        return new TrackingToken(ToBase64Url(raw), SHA256.HashData(raw));
    }

    public static bool TryHash(string value, out byte[] hash)
    {
        hash = [];
        if (value.Length != 43 || value.Any(character => !char.IsLetterOrDigit(character) && character is not '-' and not '_'))
            return false;

        try
        {
            var raw = Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/') + "=");
            if (raw.Length != 32)
                return false;

            hash = SHA256.HashData(raw);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string ToBase64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
