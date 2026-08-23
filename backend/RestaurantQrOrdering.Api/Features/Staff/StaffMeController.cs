using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RestaurantQrOrdering.Api.Features.Staff;

[ApiController]
[Route("api/staff/me")]
[Authorize]
public sealed class StaffMeController(
    IStaffProfileStore profileStore,
    ILogger<StaffMeController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(StaffIdentityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<StaffIdentityResponse>> Get(CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId))
            return Unauthorized();

        try
        {
            var profile = await profileStore.GetAsync(userId, cancellationToken);
            if (profile is null || !StaffRoles.IsKnown(profile.Role))
                return Forbid();

            Response.Headers.CacheControl = "no-store";
            return Ok(new StaffIdentityResponse(profile.Role!, profile.FullName));
        }
        catch (StaffProfileStoreUnavailableException exception)
        {
            logger.LogError(exception, "Staff profile lookup failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Staff service unavailable");
        }
    }
}
