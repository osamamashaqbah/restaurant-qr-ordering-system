using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantQrOrdering.Api.Features.PublicMenu;
using RestaurantQrOrdering.Api.Features.Staff;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class AdminMenuTests
{
    [Fact]
    public async Task Admin_menu_get_returns_the_menu_contract()
    {
        var menu = new PublicMenuResponse([], []);
        var controller = CreateController(new RecordingMenuStore { Menu = menu }, new RecordingAdminMenuStore());

        var result = await controller.Get(CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(menu, response.Value);
    }

    [Fact]
    public async Task Admin_menu_can_create_a_category()
    {
        var store = new RecordingAdminMenuStore { CreatedId = Guid.NewGuid() };
        var controller = CreateController(new RecordingMenuStore(), store);

        var result = await controller.CreateCategory(
            new CreateCategoryRequest { NameEn = "Mains", NameAr = "الرئيسية" },
            CancellationToken.None);

        var response = Assert.IsType<CreatedResult>(result);
        Assert.Equal(store.CreatedId, response.Value?.GetType().GetProperty("id")?.GetValue(response.Value));
    }

    [Fact]
    public async Task Admin_menu_maps_missing_items_to_not_found()
    {
        var store = new RecordingAdminMenuStore { CommandResult = AdminMenuCommandResult.NotFound };
        var controller = CreateController(new RecordingMenuStore(), store);

        var result = await controller.DeleteItem(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Admin_menu_routes_require_authentication()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/staff/admin/menu");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static AdminMenuController CreateController(IPublicMenuStore menuStore, IAdminMenuStore store) =>
        new(menuStore, store, NullLogger<AdminMenuController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    private sealed class RecordingMenuStore : IPublicMenuStore
    {
        public PublicMenuResponse Menu { get; init; } = new([], []);
        public Task<PublicMenuResponse> GetAsync(CancellationToken cancellationToken) => Task.FromResult(Menu);
    }

    private sealed class RecordingAdminMenuStore : IAdminMenuStore
    {
        public Guid CreatedId { get; init; } = Guid.NewGuid();
        public AdminMenuCommandResult CommandResult { get; init; } = AdminMenuCommandResult.Succeeded;

        public Task<Guid> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken) => Task.FromResult(CreatedId);
        public Task<AdminMenuCommandResult> UpdateCategoryAsync(Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken) => Task.FromResult(CommandResult);
        public Task<AdminMenuCommandResult> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken) => Task.FromResult(CommandResult);
        public Task<Guid> CreateItemAsync(CreateMenuItemRequest request, CancellationToken cancellationToken) => Task.FromResult(CreatedId);
        public Task<AdminMenuCommandResult> UpdateItemAsync(Guid itemId, UpdateMenuItemRequest request, CancellationToken cancellationToken) => Task.FromResult(CommandResult);
        public Task<AdminMenuCommandResult> DeleteItemAsync(Guid itemId, CancellationToken cancellationToken) => Task.FromResult(CommandResult);
    }
}
