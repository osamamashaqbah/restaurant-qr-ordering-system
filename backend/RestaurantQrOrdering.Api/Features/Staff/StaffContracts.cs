namespace RestaurantQrOrdering.Api.Features.Staff;

public static class StaffRoles
{
    public const string Admin = "admin";
    public const string Cashier = "cashier";
    public const string Kitchen = "kitchen";

    public static bool IsKnown(string? role) => role is Admin or Cashier or Kitchen;
}

public static class StaffPolicies
{
    public const string AnyStaff = "staff";
    public const string Admin = "admin";
    public const string Cashier = "cashier";
    public const string Kitchen = "kitchen";
}

public sealed record StaffProfile(Guid UserId, string? Role, string FullName);

public sealed record StaffIdentityResponse(string Role, string FullName);
