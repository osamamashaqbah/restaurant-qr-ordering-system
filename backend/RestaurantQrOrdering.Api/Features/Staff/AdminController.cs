using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RestaurantQrOrdering.Api.Features.Staff;

[ApiController]
[Route("api/staff/admin")]
[Authorize(Policy = StaffPolicies.Admin)]
public sealed class AdminController(
    IAdminStore store,
    ILogger<AdminController> logger) : ControllerBase
{
    [HttpGet("staff")]
    [ProducesResponseType(typeof(IReadOnlyList<StaffMember>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<StaffMember>>> ListStaff(CancellationToken cancellationToken)
    {
        try
        {
            Response.Headers.CacheControl = "no-store";
            return Ok(await store.ListStaffAsync(cancellationToken));
        }
        catch (AdminStoreUnavailableException exception)
        {
            logger.LogError(exception, "Admin staff list failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Admin service unavailable");
        }
    }

    [HttpPatch("staff/{staffId:guid}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> UpdateRole(
        Guid staffId,
        UpdateStaffRoleRequest request,
        CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var actorId))
            return Unauthorized();
        if (!StaffRoles.IsKnown(request.Role))
            return BadRequest(new { error = "invalid_role" });

        try
        {
            return await store.UpdateRoleAsync(actorId, staffId, request.Role, cancellationToken) switch
            {
                AdminCommandResult.Succeeded => NoContent(),
                AdminCommandResult.NotFound => NotFound(),
                AdminCommandResult.NotAuthorized => Forbid(),
                AdminCommandResult.SelfRoleChange => Conflict(new { error = "self_role_change" }),
                AdminCommandResult.InvalidRole => BadRequest(new { error = "invalid_role" }),
                _ => Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Admin service unavailable"),
            };
        }
        catch (AdminStoreUnavailableException exception)
        {
            logger.LogError(exception, "Admin staff role update failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Admin service unavailable");
        }
    }
}
