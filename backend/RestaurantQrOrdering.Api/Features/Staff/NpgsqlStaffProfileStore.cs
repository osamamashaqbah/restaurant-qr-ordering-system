using Npgsql;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed class NpgsqlStaffProfileStore(NpgsqlDataSource dataSource) : IStaffProfileStore
{
    public async Task<StaffProfile?> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                select role::text, full_name
                from public.profiles
                where id = $1
                """);
            command.Parameters.AddWithValue(userId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            if (!await reader.ReadAsync(cancellationToken))
                return null;

            return new StaffProfile(
                userId,
                reader.IsDBNull(0) ? null : reader.GetString(0),
                reader.IsDBNull(1) ? string.Empty : reader.GetString(1));
        }
        catch (NpgsqlException exception)
        {
            throw new StaffProfileStoreUnavailableException(exception);
        }
    }
}

public sealed class UnavailableStaffProfileStore : IStaffProfileStore
{
    public Task<StaffProfile?> GetAsync(Guid userId, CancellationToken cancellationToken) =>
        throw new StaffProfileStoreUnavailableException();
}
