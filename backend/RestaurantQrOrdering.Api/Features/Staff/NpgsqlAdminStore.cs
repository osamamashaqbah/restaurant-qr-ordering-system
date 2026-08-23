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

    public async Task<IReadOnlyList<SecurityEvent>> ListSecurityEventsAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                select e.id, e.event_type, e.actor_id, actor.email,
                       e.target_id, target.email,
                       e.detail->>'old_role', e.detail->>'new_role', e.created_at
                  from public.security_events e
                  left join auth.users actor on actor.id = e.actor_id
                  left join auth.users target on target.id = e.target_id
                 order by e.created_at desc
                 limit 20
                """);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var events = new List<SecurityEvent>();
            while (await reader.ReadAsync(cancellationToken))
            {
                events.Add(new SecurityEvent(
                    reader.GetGuid(0),
                    reader.GetString(1),
                    reader.IsDBNull(2) ? null : reader.GetGuid(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.IsDBNull(4) ? null : reader.GetGuid(4),
                    reader.IsDBNull(5) ? null : reader.GetString(5),
                    reader.IsDBNull(6) ? null : reader.GetString(6),
                    reader.IsDBNull(7) ? null : reader.GetString(7),
                    reader.GetFieldValue<DateTimeOffset>(8)));
            }

            return events;
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

    public Task<IReadOnlyList<SecurityEvent>> ListSecurityEventsAsync(CancellationToken cancellationToken) =>
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
