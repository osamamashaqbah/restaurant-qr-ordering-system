using Npgsql;
using NpgsqlTypes;
using System.Text.Json;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed class NpgsqlAdminStore(NpgsqlDataSource dataSource) : IAdminStore
{
    public async Task<IReadOnlyList<StaffMember>> ListStaffAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                select p.id, u.email, p.full_name, p.role::text, p.created_at
                from public.profiles p
                join auth.users u on u.id = p.id
                order by p.created_at desc
                """);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var staff = new List<StaffMember>();
            while (await reader.ReadAsync(cancellationToken))
            {
                staff.Add(new StaffMember(
                    reader.GetGuid(0),
                    reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.GetFieldValue<DateTimeOffset>(4)));
            }

            return staff;
        }
        catch (NpgsqlException exception)
        {
            throw new AdminStoreUnavailableException(exception);
        }
    }

    public async Task<AdminCommandResult> UpdateRoleAsync(
        Guid actorId,
        Guid targetId,
        string role,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.admin_update_staff_role($1, $2, $3)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = actorId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = targetId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = role });

            return (await command.ExecuteScalarAsync(cancellationToken))?.ToString() switch
            {
                "ok" => AdminCommandResult.Succeeded,
                "not_found" => AdminCommandResult.NotFound,
                "not_authorized" => AdminCommandResult.NotAuthorized,
                "self_role" => AdminCommandResult.SelfRoleChange,
                "invalid_role" => AdminCommandResult.InvalidRole,
                _ => throw new AdminStoreUnavailableException(),
            };
        }
        catch (NpgsqlException exception)
        {
            throw new AdminStoreUnavailableException(exception);
        }
    }

    public async Task<SalesSummary> GetSalesSummaryAsync(
        Guid actorId,
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.admin_get_sales_summary($1, $2, $3)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = actorId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.TimestampTz, Value = start });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.TimestampTz, Value = end });

            var json = (await command.ExecuteScalarAsync(cancellationToken))?.ToString();
            return json is null
                ? throw new AdminStoreUnavailableException()
                : JsonSerializer.Deserialize<SalesSummary>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))
                    ?? throw new AdminStoreUnavailableException();
        }
        catch (NpgsqlException exception)
        {
            throw new AdminStoreUnavailableException(exception);
        }
        catch (JsonException exception)
        {
            throw new AdminStoreUnavailableException(exception);
        }
    }
}

public sealed class UnavailableAdminStore : IAdminStore
{
    public Task<IReadOnlyList<StaffMember>> ListStaffAsync(CancellationToken cancellationToken) =>
        throw new AdminStoreUnavailableException();

    public Task<AdminCommandResult> UpdateRoleAsync(
        Guid actorId,
        Guid targetId,
        string role,
        CancellationToken cancellationToken) =>
        throw new AdminStoreUnavailableException();

    public Task<SalesSummary> GetSalesSummaryAsync(
        Guid actorId,
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken) =>
        throw new AdminStoreUnavailableException();
}
