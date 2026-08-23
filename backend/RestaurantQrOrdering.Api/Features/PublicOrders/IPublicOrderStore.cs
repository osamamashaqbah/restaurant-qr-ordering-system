namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public interface IPublicOrderStore
{
    Task<Guid> CreateAsync(CreateOrderRequest request, ReadOnlyMemory<byte> tokenHash, CancellationToken cancellationToken);
    Task<PublicOrderTracking?> FindByTokenHashAsync(ReadOnlyMemory<byte> tokenHash, CancellationToken cancellationToken);
}

public sealed class PublicOrderStoreUnavailableException : Exception
{
    public PublicOrderStoreUnavailableException(Exception? innerException = null)
        : base("The public order store is not configured or unavailable.", innerException)
    {
    }
}
