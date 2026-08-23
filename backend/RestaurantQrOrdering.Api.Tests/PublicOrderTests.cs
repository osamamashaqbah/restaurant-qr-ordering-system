using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantQrOrdering.Api.Features.PublicOrders;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class PublicOrderTests
{
    [Fact]
    public void Tracking_token_round_trips_to_the_same_hash()
    {
        var token = TrackingToken.Create();

        Assert.True(TrackingToken.TryHash(token.Value, out var hash));
        Assert.Equal(token.Hash, hash);
        Assert.Equal(43, token.Value.Length);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-token")]
    [InlineData("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!")]
    public void Invalid_tracking_tokens_are_rejected_without_database_access(string value)
    {
        Assert.False(TrackingToken.TryHash(value, out _));
    }

    [Fact]
    public async Task Invalid_tracking_route_returns_404_without_calling_the_store()
    {
        var store = new RecordingStore();
        var controller = CreateController(store);

        var result = await controller.Track("not-a-token", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
        Assert.False(store.LookupCalled);
    }

    [Fact]
    public async Task Valid_tracking_route_returns_only_the_safe_tracking_contract()
    {
        var token = TrackingToken.Create();
        var store = new RecordingStore
        {
            Tracking = new PublicOrderTracking(
                "ready",
                12.50m,
                DateTimeOffset.UtcNow.AddMinutes(-5),
                DateTimeOffset.UtcNow,
                null,
                [new PublicOrderItem("Hummus", "حمص", 6.25m, 2)]),
        };
        var controller = CreateController(store);

        var result = await controller.Track(token.Value, CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(store.Tracking, response.Value);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
        Assert.Equal("no-referrer", controller.Response.Headers["Referrer-Policy"].ToString());
    }

    [Fact]
    public async Task Invalid_create_request_is_rejected_before_the_store_is_called()
    {
        var store = new RecordingStore();
        var controller = CreateController(store);
        var request = new CreateOrderRequest
        {
            CustomerName = "Sara",
            CustomerWhatsapp = "0791234567",
            TableNumber = "7",
            Items = [new CreateOrderItemRequest { MenuItemId = Guid.NewGuid(), Quantity = 1, Notes = new string('x', 301) }],
        };

        var result = await controller.Create(request, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.False(store.CreateCalled);
    }

    [Fact]
    public async Task Valid_create_request_returns_only_a_tracking_token()
    {
        var store = new RecordingStore();
        var controller = CreateController(store);
        var request = new CreateOrderRequest
        {
            CustomerName = "Sara",
            CustomerWhatsapp = "962791234567",
            TableNumber = "7",
            Items = [new CreateOrderItemRequest { MenuItemId = Guid.NewGuid(), Quantity = 2 }],
        };

        var result = await controller.Create(request, CancellationToken.None);

        var response = Assert.IsType<ObjectResult>(result.Result);
        var body = Assert.IsType<CreateOrderResponse>(response.Value);
        Assert.Equal(StatusCodes.Status201Created, response.StatusCode);
        Assert.True(TrackingToken.TryHash(body.TrackingToken, out _));
        Assert.True(store.CreateCalled);
    }

    [Fact]
    public void Null_whatsapp_is_rejected_without_throwing()
    {
        var errors = PublicOrderValidation.Validate(new CreateOrderRequest
        {
            CustomerName = "Sara",
            CustomerWhatsapp = null!,
            TableNumber = "7",
            Items = [new CreateOrderItemRequest { MenuItemId = Guid.NewGuid(), Quantity = 1 }],
        });

        Assert.Contains(nameof(CreateOrderRequest.CustomerWhatsapp), errors.Keys);
    }

    private static PublicOrdersController CreateController(RecordingStore store)
    {
        var controller = new PublicOrdersController(store, NullLogger<PublicOrdersController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        return controller;
    }

    private sealed class RecordingStore : IPublicOrderStore
    {
        public bool LookupCalled { get; private set; }
        public bool CreateCalled { get; private set; }
        public PublicOrderTracking? Tracking { get; init; }

        public Task<Guid> CreateAsync(CreateOrderRequest request, ReadOnlyMemory<byte> tokenHash, CancellationToken cancellationToken) =>
            CreateOrder();

        private Task<Guid> CreateOrder()
        {
            CreateCalled = true;
            return Task.FromResult(Guid.NewGuid());
        }

        public Task<PublicOrderTracking?> FindByTokenHashAsync(ReadOnlyMemory<byte> tokenHash, CancellationToken cancellationToken)
        {
            LookupCalled = true;
            return Task.FromResult(Tracking);
        }
    }
}
