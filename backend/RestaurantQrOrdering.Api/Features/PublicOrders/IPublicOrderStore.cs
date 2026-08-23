namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public interface IPublicOrderStore
{
    Task<Guid> CreateAsync(
        CreateOrderRequest request,
        ReadOnlyMemory<byte> tokenHash,
        ReadOnlyMemory<byte> requestHash,
        CancellationToken cancellationToken);
    Task<PublicOrderTracking?> FindByTokenHashAsync(ReadOnlyMemory<byte> tokenHash, CancellationToken cancellationToken);
}

public sealed class PublicOrderStoreUnavailableException : Exception
{
    public PublicOrderStoreUnavailableException(Exception? innerException = null)
        : base("The public order store is not configured or unavailable.", innerException)
    {
    }
}

public sealed class PublicOrderIdempotencyConflictException : Exception
{
    public PublicOrderIdempotencyConflictException()
        : base("The idempotency key was already used for a different order.")
    {
    }
}
