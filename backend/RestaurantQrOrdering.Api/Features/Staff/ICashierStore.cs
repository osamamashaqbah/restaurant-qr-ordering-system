namespace RestaurantQrOrdering.Api.Features.Staff;

public interface ICashierStore
{
    Task<IReadOnlyList<CashierOrder>> GetOrdersAsync(CancellationToken cancellationToken);

    Task<CashierCommandResult> CloseAsync(
        Guid orderId,
        Guid actorId,
        CancellationToken cancellationToken);

    Task<CashierCommandResult> SetAvailabilityAsync(
        Guid itemId,
        Guid actorId,
        bool isAvailable,
        CancellationToken cancellationToken);
}

public sealed class CashierStoreUnavailableException(Exception? innerException = null)
    : Exception("The cashier store is unavailable.", innerException);
