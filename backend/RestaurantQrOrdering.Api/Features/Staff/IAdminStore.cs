namespace RestaurantQrOrdering.Api.Features.Staff;

public interface IAdminStore
{
    Task<IReadOnlyList<StaffMember>> ListStaffAsync(CancellationToken cancellationToken);

    Task<AdminCommandResult> UpdateRoleAsync(
        Guid actorId,
        Guid targetId,
        string role,
        CancellationToken cancellationToken);
}

public sealed class AdminStoreUnavailableException(Exception? innerException = null)
    : Exception("The admin store is unavailable.", innerException);
