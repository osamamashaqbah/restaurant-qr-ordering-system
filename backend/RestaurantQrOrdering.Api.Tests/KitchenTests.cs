using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantQrOrdering.Api.Features.Staff;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class KitchenTests
{
    [Fact]
    public async Task Kitchen_orders_returns_the_safe_board_model()
    {
        var order = new KitchenOrder(
            Guid.NewGuid(),
            "7",
            "preparing",
            DateTimeOffset.UtcNow,
            [new KitchenOrderItem(Guid.NewGuid(), "Hummus", 2, "No onions")]);
        var store = new RecordingKitchenStore { Orders = [order] };
        var controller = CreateController(store, Guid.NewGuid());

        var result = await controller.GetOrders(CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(store.Orders, response.Value);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
    }

    [Fact]
    public async Task Kitchen_command_returns_no_content_when_the_transition_succeeds()
    {
        var store = new RecordingKitchenStore { CommandResult = KitchenCommandResult.Succeeded };
        var actorId = Guid.NewGuid();
        var controller = CreateController(store, actorId);

        var result = await controller.StartPreparing(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(actorId, store.ActorId);
        Assert.Equal("preparing", store.NextStatus);
    }

    [Fact]
    public async Task Kitchen_command_returns_conflict_for_an_invalid_transition()
    {
        var store = new RecordingKitchenStore { CommandResult = KitchenCommandResult.InvalidTransition };
        var controller = CreateController(store, Guid.NewGuid());

        var result = await controller.MarkReady(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Kitchen_command_requires_a_valid_user_subject()
    {
        var store = new RecordingKitchenStore();
        var controller = CreateController(store, null);

        var result = await controller.Cancel(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result);
        Assert.False(store.CommandCalled);
    }

    [Fact]
    public async Task Kitchen_store_failures_return_service_unavailable()
    {
        var controller = CreateController(new UnavailableKitchenStore(), Guid.NewGuid());

        var result = await controller.GetOrders(CancellationToken.None);

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Kitchen_routes_require_authentication()
    {
        using var factory = new TestAppFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/staff/kitchen/orders");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static KitchenController CreateController(IKitchenStore store, Guid? actorId)
    {
        var httpContext = new DefaultHttpContext
        {
            User = actorId is null
                ? new ClaimsPrincipal(new ClaimsIdentity())
                : new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(JwtRegisteredClaimNames.Sub, actorId.Value.ToString())],
                    "test")),
        };
        return new KitchenController(store, NullLogger<KitchenController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    private sealed class RecordingKitchenStore : IKitchenStore
    {
        public IReadOnlyList<KitchenOrder> Orders { get; init; } = [];
        public KitchenCommandResult CommandResult { get; init; } = KitchenCommandResult.NotFound;
        public bool CommandCalled { get; private set; }
        public Guid ActorId { get; private set; }
        public string? NextStatus { get; private set; }

        public Task<IReadOnlyList<KitchenOrder>> GetOrdersAsync(CancellationToken cancellationToken) =>
            Task.FromResult(Orders);

        public Task<KitchenCommandResult> TransitionAsync(
            Guid orderId,
            Guid actorId,
            string nextStatus,
            CancellationToken cancellationToken)
        {
            CommandCalled = true;
            ActorId = actorId;
            NextStatus = nextStatus;
            return Task.FromResult(CommandResult);
        }
    }
}
