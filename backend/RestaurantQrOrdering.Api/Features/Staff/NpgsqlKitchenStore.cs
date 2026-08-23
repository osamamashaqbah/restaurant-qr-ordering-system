using Npgsql;
using NpgsqlTypes;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed class NpgsqlKitchenStore(NpgsqlDataSource dataSource) : IKitchenStore
{
    public async Task<IReadOnlyList<KitchenOrder>> GetOrdersAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                select
                  o.id, o.table_number, o.status::text, o.created_at,
                  oi.id, oi.name_en, oi.quantity, oi.notes
                from public.orders o
                left join public.order_items oi on oi.order_id = o.id
                where o.status in ('new', 'preparing', 'ready')
                order by o.created_at, oi.id
                """);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            var orders = new Dictionary<Guid, (string TableNumber, string Status, DateTimeOffset CreatedAt, List<KitchenOrderItem> Items)>();
            while (await reader.ReadAsync(cancellationToken))
            {
                var orderId = reader.GetGuid(0);
                if (!orders.TryGetValue(orderId, out var order))
                {
                    order = (
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.GetFieldValue<DateTimeOffset>(3),
                        []);
                    orders.Add(orderId, order);
                }

                if (!reader.IsDBNull(4))
                {
                    order.Items.Add(new KitchenOrderItem(
                        reader.GetGuid(4),
                        reader.GetString(5),
                        reader.GetInt32(6),
                        reader.GetString(7)));
                }
            }

            return orders.Select(item => new KitchenOrder(
                item.Key,
                item.Value.TableNumber,
                item.Value.Status,
                item.Value.CreatedAt,
                item.Value.Items)).ToArray();
        }
        catch (NpgsqlException exception)
        {
            throw new KitchenStoreUnavailableException(exception);
        }
    }

    public async Task<KitchenCommandResult> TransitionAsync(
        Guid orderId,
        Guid actorId,
        string nextStatus,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.staff_transition_order($1, $2, $3::public.order_status)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = orderId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = actorId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = nextStatus });

            return (await command.ExecuteScalarAsync(cancellationToken))?.ToString() switch
            {
                "ok" => KitchenCommandResult.Succeeded,
                "not_found" => KitchenCommandResult.NotFound,
                "invalid_transition" => KitchenCommandResult.InvalidTransition,
                "not_authorized" => KitchenCommandResult.NotAuthorized,
                _ => throw new KitchenStoreUnavailableException(),
            };
        }
        catch (NpgsqlException exception)
        {
            throw new KitchenStoreUnavailableException(exception);
        }
    }
}

public sealed class UnavailableKitchenStore : IKitchenStore
{
    public Task<IReadOnlyList<KitchenOrder>> GetOrdersAsync(CancellationToken cancellationToken) =>
        throw new KitchenStoreUnavailableException();

    public Task<KitchenCommandResult> TransitionAsync(
        Guid orderId,
        Guid actorId,
        string nextStatus,
        CancellationToken cancellationToken) =>
        throw new KitchenStoreUnavailableException();
}
