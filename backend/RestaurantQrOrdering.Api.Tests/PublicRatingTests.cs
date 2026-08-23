using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantQrOrdering.Api.Features.PublicOrders;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class PublicRatingTests
{
    [Fact]
    public async Task Invalid_rating_token_returns_not_found_without_store_access()
    {
        var store = new RecordingRatingStore();
        var controller = CreateController(store);

        var result = await controller.Submit(
            "not-a-token",
            new PublicRatingRequest { Stars = 5, Comment = "Great" },
            CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
        Assert.False(store.Called);
    }

    [Fact]
    public async Task Valid_rating_returns_no_content_and_no_store_cache()
    {
        var store = new RecordingRatingStore { Result = PublicRatingResult.Succeeded };
        var controller = CreateController(store);

        var result = await controller.Submit(
            TrackingToken.Create().Value,
            new PublicRatingRequest { Stars = 5, Comment = "Great" },
            CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
        Assert.True(store.Called);
    }

    [Fact]
    public async Task Duplicate_rating_returns_conflict()
    {
        var store = new RecordingRatingStore { Result = PublicRatingResult.AlreadyRated };
        var controller = CreateController(store);

        var result = await controller.Submit(
            TrackingToken.Create().Value,
            new PublicRatingRequest { Stars = 4 },
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result);
    }

    private static PublicRatingController CreateController(RecordingRatingStore store) =>
        new(store, NullLogger<PublicRatingController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    private sealed class RecordingRatingStore : IPublicRatingStore
    {
        public PublicRatingResult Result { get; init; } = PublicRatingResult.NotFound;
        public bool Called { get; private set; }

        public Task<PublicRatingResult> SubmitAsync(
            ReadOnlyMemory<byte> tokenHash,
            int stars,
            string comment,
            CancellationToken cancellationToken)
        {
            Called = true;
            return Task.FromResult(Result);
        }
    }
}
