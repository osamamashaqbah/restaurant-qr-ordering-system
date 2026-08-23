using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantQrOrdering.Api.Features.PublicMenu;

namespace RestaurantQrOrdering.Api.Features.Staff;

[ApiController]
[Route("api/staff/admin/menu")]
[Authorize(Policy = StaffPolicies.Admin)]
public sealed class AdminMenuController(
    IPublicMenuStore menuStore,
    IAdminMenuStore store,
    ILogger<AdminMenuController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PublicMenuResponse>> Get(CancellationToken cancellationToken)
    {
        try
        {
            Response.Headers.CacheControl = "no-store";
            return Ok(await menuStore.GetAsync(cancellationToken));
        }
        catch (PublicMenuStoreUnavailableException exception)
        {
            logger.LogError(exception, "Admin menu load failed");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Admin menu unavailable");
        }
    }

    [HttpPost("categories")]
    public async Task<ActionResult> CreateCategory(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await store.CreateCategoryAsync(request, cancellationToken);
            return Created($"/api/staff/admin/menu/categories/{id}", new { id });
        }
        catch (AdminMenuStoreUnavailableException exception)
        {
            return StoreProblem(exception);
        }
    }

    [HttpPut("categories/{categoryId:guid}")]
    public Task<ActionResult> UpdateCategory(Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken) =>
        MapCommand(() => store.UpdateCategoryAsync(categoryId, request, cancellationToken));

    [HttpDelete("categories/{categoryId:guid}")]
    public Task<ActionResult> DeleteCategory(Guid categoryId, CancellationToken cancellationToken) =>
        MapCommand(() => store.DeleteCategoryAsync(categoryId, cancellationToken));

    [HttpPost("items")]
    public async Task<ActionResult> CreateItem(CreateMenuItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await store.CreateItemAsync(request, cancellationToken);
            return Created($"/api/staff/admin/menu/items/{id}", new { id });
        }
        catch (AdminMenuStoreUnavailableException exception)
        {
            return StoreProblem(exception);
        }
    }

    [HttpPut("items/{itemId:guid}")]
    public Task<ActionResult> UpdateItem(Guid itemId, UpdateMenuItemRequest request, CancellationToken cancellationToken) =>
        MapCommand(() => store.UpdateItemAsync(itemId, request, cancellationToken));

    [HttpDelete("items/{itemId:guid}")]
    public Task<ActionResult> DeleteItem(Guid itemId, CancellationToken cancellationToken) =>
        MapCommand(() => store.DeleteItemAsync(itemId, cancellationToken));

    private async Task<ActionResult> MapCommand(Func<Task<AdminMenuCommandResult>> command)
    {
        try
        {
            return await command() switch
            {
                AdminMenuCommandResult.Succeeded => NoContent(),
                AdminMenuCommandResult.NotFound => NotFound(),
                AdminMenuCommandResult.Conflict => Conflict(new { error = "menu_conflict" }),
                _ => Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Admin menu unavailable"),
            };
        }
        catch (AdminMenuStoreUnavailableException exception)
        {
            return StoreProblem(exception);
        }
    }

    private ObjectResult StoreProblem(Exception exception)
    {
        logger.LogError(exception, "Admin menu command failed");
        return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Admin menu unavailable");
    }
}
