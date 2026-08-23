using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantQrOrdering.Api.Features.PublicMenu;
using RestaurantQrOrdering.Api.Features.Staff;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class CashierTests
{
    [Fact]
    public async Task Cashier_orders_returns_staff_order_details_without_generic_table_access()
    {
        var order = new CashierOrder(
            Guid.NewGuid(),
            "7",
            "ready",
            "Sara",
            "962791234567",
            12.50m,
            DateTimeOffset.UtcNow,
            [new CashierOrderItem(Guid.NewGuid(), "Hummus", 2, 6.25m)]);
        var store = new RecordingCashierStore { Orders = [order] };
        var controller = CreateController(store, Guid.NewGuid());

        var result = await controller.GetOrders(CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(store.Orders, response.Value);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
    }

    [Fact]
    public async Task Cashier_close_returns_no_content_when_the_command_succeeds()
    {
        var store = new RecordingCashierStore { CommandResult = CashierCommandResult.Succeeded };
        var actorId = Guid.NewGuid();
        var controller = CreateController(store, actorId);

        var result = await controller.Close(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(actorId, store.ActorId);
    }

    [Fact]
    public async Task Cashier_close_returns_conflict_when_the_order_is_not_ready()
    {
        var store = new RecordingCashierStore { CommandResult = CashierCommandResult.InvalidTransition };
        var controller = CreateController(store, Guid.NewGuid());

        var result = await controller.Close(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Cashier_close_requires_a_valid_user_subject()
    {
        var store = new RecordingCashierStore();
        var controller = CreateController(store, null);

        var result = await controller.Close(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result);
        Assert.False(store.CommandCalled);
    }

    [Fact]
    public async Task Cashier_availability_uses_a_separate_command()
    {
        var store = new RecordingCashierStore { CommandResult = CashierCommandResult.Succeeded };
        var actorId = Guid.NewGuid();
        var controller = CreateController(store, actorId);

        var result = await controller.SetAvailability(
            Guid.NewGuid(),
            new SetAvailabilityRequest { IsAvailable = false },
            CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(actorId, store.ActorId);
        Assert.False(store.IsAvailable);
    }

    [Fact]
    public async Task Cashier_routes_require_authentication()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/staff/cashier/orders");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static CashierController CreateController(ICashierStore store, Guid? actorId)
    {
        var httpContext = new DefaultHttpContext
        {
            User = actorId is null
                ? new ClaimsPrincipal(new ClaimsIdentity())
                : new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(JwtRegisteredClaimNames.Sub, actorId.Value.ToString())],
                    "test")),
        };
        return new CashierController(
            store,
            new FakeMenuStore(),
            NullLogger<CashierController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    private sealed class RecordingCashierStore : ICashierStore
    {
        public IReadOnlyList<CashierOrder> Orders { get; init; } = [];
        public CashierCommandResult CommandResult { get; init; } = CashierCommandResult.NotFound;
        public bool CommandCalled { get; private set; }
        public Guid ActorId { get; private set; }
        public bool IsAvailable { get; private set; }

        public Task<IReadOnlyList<CashierOrder>> GetOrdersAsync(CancellationToken cancellationToken) =>
            Task.FromResult(Orders);

        public Task<CashierCommandResult> CloseAsync(
            Guid orderId,
            Guid actorId,
            CancellationToken cancellationToken)
        {
            CommandCalled = true;
            ActorId = actorId;
            return Task.FromResult(CommandResult);
        }

        public Task<CashierCommandResult> SetAvailabilityAsync(
            Guid itemId,
            Guid actorId,
            bool isAvailable,
            CancellationToken cancellationToken)
        {
            CommandCalled = true;
            ActorId = actorId;
            IsAvailable = isAvailable;
            return Task.FromResult(CommandResult);
        }
    }

    private sealed class FakeMenuStore : IPublicMenuStore
    {
        public Task<PublicMenuResponse> GetAsync(CancellationToken cancellationToken) =>
            Task.FromResult(new PublicMenuResponse([], []));
    }
}
