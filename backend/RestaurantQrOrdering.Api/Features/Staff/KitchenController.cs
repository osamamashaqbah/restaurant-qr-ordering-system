using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RestaurantQrOrdering.Api.Features.Staff;

[ApiController]
[Route("api/staff/kitchen")]
[Authorize(Policy = StaffPolicies.Kitchen)]
public sealed class KitchenController(
    IKitchenStore store,
    ILogger<KitchenController> logger) : ControllerBase
{
    [HttpGet("orders")]
    [ProducesResponseType(typeof(IReadOnlyList<KitchenOrder>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IReadOnlyList<KitchenOrder>>> GetOrders(CancellationToken cancellationToken)
    {
        try
        {
            Response.Headers.CacheControl = "no-store";
            return Ok(await store.GetOrdersAsync(cancellationToken));
        }
        catch (KitchenStoreUnavailableException exception)
        {
            logger.LogError(exception, "Kitchen orders load failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Kitchen service unavailable");
        }
    }

    [HttpPost("orders/{orderId:guid}/start-preparing")]
    public Task<ActionResult> StartPreparing(Guid orderId, CancellationToken cancellationToken) =>
        Transition(orderId, "preparing", cancellationToken);

    [HttpPost("orders/{orderId:guid}/mark-ready")]
    public Task<ActionResult> MarkReady(Guid orderId, CancellationToken cancellationToken) =>
        Transition(orderId, "ready", cancellationToken);

    [HttpPost("orders/{orderId:guid}/cancel")]
    public Task<ActionResult> Cancel(Guid orderId, CancellationToken cancellationToken) =>
        Transition(orderId, "cancelled", cancellationToken);

    private async Task<ActionResult> Transition(
        Guid orderId,
        string nextStatus,
        CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var actorId))
            return Unauthorized();

        try
        {
            return await store.TransitionAsync(orderId, actorId, nextStatus, cancellationToken) switch
            {
                KitchenCommandResult.Succeeded => NoContent(),
                KitchenCommandResult.NotFound => NotFound(),
                KitchenCommandResult.InvalidTransition => Conflict(new { error = "invalid_transition" }),
                KitchenCommandResult.NotAuthorized => Forbid(),
                _ => Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Kitchen service unavailable"),
            };
        }
        catch (KitchenStoreUnavailableException exception)
        {
            logger.LogError(exception, "Kitchen order transition failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Kitchen service unavailable");
        }
    }
}
