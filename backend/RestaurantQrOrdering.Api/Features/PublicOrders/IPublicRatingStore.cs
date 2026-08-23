namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public interface IPublicRatingStore
{
    Task<PublicRatingResult> SubmitAsync(
        ReadOnlyMemory<byte> tokenHash,
        int stars,
        string comment,
        CancellationToken cancellationToken);
}

public sealed class PublicRatingStoreUnavailableException(Exception? innerException = null)
    : Exception("The public rating store is unavailable.", innerException);
