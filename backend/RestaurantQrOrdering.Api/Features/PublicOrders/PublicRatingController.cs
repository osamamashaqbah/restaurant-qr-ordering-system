using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

[ApiController]
[Route("api/public/orders/{trackingToken}/rating")]
public sealed class PublicRatingController(
    IPublicRatingStore store,
    ILogger<PublicRatingController> logger) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("public-order-rating")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult> Submit(
        string trackingToken,
        PublicRatingRequest request,
        CancellationToken cancellationToken)
    {
        if (!TrackingToken.TryHash(trackingToken, out var tokenHash))
            return NotFound();

        try
        {
            Response.Headers.CacheControl = "no-store";
            return await store.SubmitAsync(tokenHash, request.Stars, request.Comment ?? string.Empty, cancellationToken) switch
            {
                PublicRatingResult.Succeeded => NoContent(),
                PublicRatingResult.NotFound => NotFound(),
                PublicRatingResult.AlreadyRated => Conflict(new { error = "already_rated" }),
                _ => Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Rating service unavailable"),
            };
        }
        catch (PublicRatingStoreUnavailableException exception)
        {
            logger.LogError(exception, "Public rating submission failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Rating service unavailable");
        }
    }
}
