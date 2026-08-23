using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed class StaffRoleRequirement(params string[] allowedRoles) : IAuthorizationRequirement
{
    public IReadOnlySet<string> AllowedRoles { get; } = allowedRoles.ToHashSet(StringComparer.OrdinalIgnoreCase);
}

public sealed class StaffRoleAuthorizationHandler(IStaffProfileStore profileStore)
    : AuthorizationHandler<StaffRoleRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        StaffRoleRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true)
            return;

        var subject = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId))
            return;

        StaffProfile? profile;
        try
        {
            profile = await profileStore.GetAsync(userId, CancellationToken.None);
        }
        catch (StaffProfileStoreUnavailableException)
        {
            return;
        }

        if (profile is not null && profile.Role is not null && requirement.AllowedRoles.Contains(profile.Role))
            context.Succeed(requirement);
    }
}
