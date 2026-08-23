using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantQrOrdering.Api.Features.PublicMenu;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class PublicMenuTests
{
    [Fact]
    public async Task Menu_endpoint_returns_public_menu_without_customer_data()
    {
        var menu = new PublicMenuResponse(
            [new PublicCategory(Guid.NewGuid(), "Mains", "الرئيسية", 1)],
            [new PublicMenuItem(
                Guid.NewGuid(),
                Guid.NewGuid(),
                "Hummus",
                "حمص",
                "",
                "",
                3.50m,
                null,
                [],
                true)]);
        var controller = new PublicMenuController(
            new FakeMenuStore(menu),
            NullLogger<PublicMenuController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await controller.Get(CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(menu, response.Value);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
    }

    private sealed class FakeMenuStore(PublicMenuResponse menu) : IPublicMenuStore
    {
        public Task<PublicMenuResponse> GetAsync(CancellationToken cancellationToken) => Task.FromResult(menu);
    }
}
