using Microsoft.Extensions.Caching.Memory;
using RestaurantQrOrdering.Api.Features.PublicMenu;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class PublicMenuCacheTests
{
    [Fact]
    public async Task Concurrent_misses_share_one_database_load()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var cache = new PublicMenuCache(memoryCache);
        var loadCount = 0;
        var menu = new PublicMenuResponse([], []);

        var results = await Task.WhenAll(Enumerable.Range(0, 20).Select(_ => cache.GetAsync(async _ =>
        {
            Interlocked.Increment(ref loadCount);
            await Task.Delay(25);
            return menu;
        }, CancellationToken.None)));

        Assert.Equal(1, loadCount);
        Assert.All(results, result => Assert.Same(menu, result));
    }

    [Fact]
    public async Task Invalidate_forces_the_next_request_to_reload()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var cache = new PublicMenuCache(memoryCache);
        var loadCount = 0;

        await cache.GetAsync(_ => Task.FromResult(new PublicMenuResponse([], [])), CancellationToken.None);
        cache.Invalidate();
        await cache.GetAsync(_ =>
        {
            Interlocked.Increment(ref loadCount);
            return Task.FromResult(new PublicMenuResponse([], []));
        }, CancellationToken.None);

        Assert.Equal(1, loadCount);
    }
}
