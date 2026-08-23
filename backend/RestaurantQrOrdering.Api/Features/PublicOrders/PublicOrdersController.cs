using Microsoft.AspNetCore.Mvc;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

[ApiController]
[Route("api/public/orders")]
public sealed class PublicOrdersController(
    IPublicOrderStore store,
    ILogger<PublicOrdersController> logger) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(CreateOrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<CreateOrderResponse>> Create(
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var validationErrors = PublicOrderValidation.Validate(request);
        if (validationErrors.Count > 0)
            return BadRequest(new ValidationProblemDetails(validationErrors));

        var token = TrackingToken.Create();
        try
        {
            await store.CreateAsync(request, token.Hash, cancellationToken);
            Response.Headers.CacheControl = "no-store";
            return StatusCode(StatusCodes.Status201Created, new CreateOrderResponse(token.Value));
        }
        catch (PublicOrderStoreUnavailableException exception)
        {
            logger.LogError(exception, "Public order creation failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Order service unavailable");
        }
    }

    [HttpGet("{trackingToken}/tracking")]
    [ProducesResponseType(typeof(PublicOrderTracking), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<PublicOrderTracking>> Track(
        string trackingToken,
        CancellationToken cancellationToken)
    {
        if (!TrackingToken.TryHash(trackingToken, out var tokenHash))
            return NotFound();

        try
        {
            var order = await store.FindByTokenHashAsync(tokenHash, cancellationToken);
            if (order is null)
                return NotFound();

            Response.Headers.CacheControl = "no-store";
            Response.Headers["Referrer-Policy"] = "no-referrer";
            return Ok(order);
        }
        catch (PublicOrderStoreUnavailableException exception)
        {
            logger.LogError(exception, "Public order tracking failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Order service unavailable");
        }
    }
}
