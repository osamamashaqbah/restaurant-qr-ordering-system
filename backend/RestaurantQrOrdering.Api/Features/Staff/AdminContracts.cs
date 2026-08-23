namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed record StaffMember(
    Guid Id,
    string Email,
    string FullName,
    string? Role,
    DateTimeOffset CreatedAt);

public sealed class UpdateStaffRoleRequest
{
    public string Role { get; init; } = string.Empty;
}

public enum AdminCommandResult
{
    Succeeded,
    NotFound,
    NotAuthorized,
    SelfRoleChange,
    InvalidRole,
}
