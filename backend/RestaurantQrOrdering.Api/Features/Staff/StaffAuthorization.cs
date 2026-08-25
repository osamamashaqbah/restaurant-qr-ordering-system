using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Mvc;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed class StaffRoleRequirement(params string[] allowedRoles) : IAuthorizationRequirement
{
    public IReadOnlySet<string> AllowedRoles { get; } = allowedRoles.ToHashSet(StringComparer.OrdinalIgnoreCase);
}

public sealed class StaffRoleAuthorizationHandler(IStaffProfileStore profileStore)
    : AuthorizationHandler<StaffRoleRequirement>
{
    internal const string StoreUnavailableItem = "staff-profile-store-unavailable";

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
            if (context.Resource is HttpContext httpContext)
                httpContext.Items[StoreUnavailableItem] = true;
            return;
        }

        if (profile is not null && profile.Role is not null && requirement.AllowedRoles.Contains(profile.Role))
            context.Succeed(requirement);
    }
}

public sealed class StaffAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler defaultHandler = new();

    public Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Forbidden && context.Items.ContainsKey(StaffRoleAuthorizationHandler.StoreUnavailableItem))
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            return context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Staff service unavailable",
            });
        }

        return defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
