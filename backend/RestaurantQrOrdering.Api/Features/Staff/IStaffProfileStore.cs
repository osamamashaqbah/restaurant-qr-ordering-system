namespace RestaurantQrOrdering.Api.Features.Staff;

public interface IStaffProfileStore
{
    Task<StaffProfile?> GetAsync(Guid userId, CancellationToken cancellationToken);
}

public sealed class StaffProfileStoreUnavailableException(Exception? innerException = null)
    : Exception("The staff profile store is unavailable.", innerException);
