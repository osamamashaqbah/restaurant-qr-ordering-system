using Microsoft.Extensions.Caching.Memory;

namespace RestaurantQrOrdering.Api.Features.PublicMenu;

public sealed class PublicMenuCache(IMemoryCache memoryCache)
{
    private const string CacheKey = "public-menu";
    private static readonly TimeSpan Lifetime = TimeSpan.FromSeconds(5);
    private readonly SemaphoreSlim refreshGate = new(1, 1);

    public async Task<PublicMenuResponse> GetAsync(
        Func<CancellationToken, Task<PublicMenuResponse>> loader,
        CancellationToken cancellationToken)
    {
        if (memoryCache.TryGetValue(CacheKey, out PublicMenuResponse? cached) && cached is not null)
            return cached;

        await refreshGate.WaitAsync(cancellationToken);
        try
        {
            if (memoryCache.TryGetValue(CacheKey, out cached) && cached is not null)
                return cached;

            var menu = await loader(CancellationToken.None);
            memoryCache.Set(CacheKey, menu, Lifetime);
            return menu;
        }
        finally
        {
            refreshGate.Release();
        }
    }

    public void Invalidate() => memoryCache.Remove(CacheKey);
}
