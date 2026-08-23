using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RestaurantQrOrdering.Api.Features.Staff;

[ApiController]
[Route("api/staff/cashier")]
[Authorize(Policy = StaffPolicies.Cashier)]
public sealed class CashierController(
    ICashierStore store,
    ILogger<CashierController> logger) : ControllerBase
{
    [HttpGet("orders")]
    [ProducesResponseType(typeof(IReadOnlyList<CashierOrder>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IReadOnlyList<CashierOrder>>> GetOrders(CancellationToken cancellationToken)
    {
        try
        {
            Response.Headers.CacheControl = "no-store";
            return Ok(await store.GetOrdersAsync(cancellationToken));
        }
        catch (CashierStoreUnavailableException exception)
        {
            logger.LogError(exception, "Cashier orders load failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Cashier service unavailable");
        }
    }

    [HttpPost("orders/{orderId:guid}/close")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult> Close(Guid orderId, CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var actorId))
            return Unauthorized();

        try
        {
            return await store.CloseAsync(orderId, actorId, cancellationToken) switch
            {
                CashierCommandResult.Succeeded => NoContent(),
                CashierCommandResult.NotFound => NotFound(),
                CashierCommandResult.InvalidTransition => Conflict(new { error = "invalid_transition" }),
                CashierCommandResult.NotAuthorized => Forbid(),
                _ => Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Cashier service unavailable"),
            };
        }
        catch (CashierStoreUnavailableException exception)
        {
            logger.LogError(exception, "Cashier order close failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Cashier service unavailable");
        }
    }
}
