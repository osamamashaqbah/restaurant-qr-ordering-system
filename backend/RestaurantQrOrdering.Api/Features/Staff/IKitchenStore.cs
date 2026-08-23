namespace RestaurantQrOrdering.Api.Features.Staff;

public interface IKitchenStore
{
    Task<IReadOnlyList<KitchenOrder>> GetOrdersAsync(CancellationToken cancellationToken);

    Task<KitchenCommandResult> TransitionAsync(
        Guid orderId,
        Guid actorId,
        string nextStatus,
        CancellationToken cancellationToken);
}

public sealed class KitchenStoreUnavailableException(Exception? innerException = null)
    : Exception("The kitchen store is unavailable.", innerException);
