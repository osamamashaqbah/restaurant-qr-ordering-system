using Microsoft.AspNetCore.Mvc;

namespace RestaurantQrOrdering.Api.Features.PublicMenu;

[ApiController]
[Route("api/public/menu")]
public sealed class PublicMenuController(
    IPublicMenuStore store,
    ILogger<PublicMenuController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PublicMenuResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<PublicMenuResponse>> Get(CancellationToken cancellationToken)
    {
        try
        {
            Response.Headers.CacheControl = "no-store";
            return Ok(await store.GetAsync(cancellationToken));
        }
        catch (PublicMenuStoreUnavailableException exception)
        {
            logger.LogError(exception, "Public menu load failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Menu service unavailable");
        }
    }
}
