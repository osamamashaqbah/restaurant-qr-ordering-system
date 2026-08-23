using Npgsql;
using NpgsqlTypes;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed class NpgsqlCashierStore(NpgsqlDataSource dataSource) : ICashierStore
{
    public async Task<IReadOnlyList<CashierOrder>> GetOrdersAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                select
                  o.id, o.table_number, o.status::text, o.customer_name,
                  o.customer_whatsapp, o.total, o.created_at,
                  oi.id, oi.name_en, oi.quantity, oi.unit_price
                from public.orders o
                left join public.order_items oi on oi.order_id = o.id
                where o.status in ('new', 'preparing', 'ready')
                order by o.created_at, oi.id
                """);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            var orders = new Dictionary<Guid, (string TableNumber, string Status, string CustomerName, string CustomerWhatsapp, decimal Total, DateTimeOffset CreatedAt, List<CashierOrderItem> Items)>();
            while (await reader.ReadAsync(cancellationToken))
            {
                var orderId = reader.GetGuid(0);
                if (!orders.TryGetValue(orderId, out var order))
                {
                    order = (
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.GetString(3),
                        reader.GetString(4),
                        reader.GetDecimal(5),
                        reader.GetFieldValue<DateTimeOffset>(6),
                        []);
                    orders.Add(orderId, order);
                }

                if (!reader.IsDBNull(7))
                {
                    order.Items.Add(new CashierOrderItem(
                        reader.GetGuid(7),
                        reader.GetString(8),
                        reader.GetInt32(9),
                        reader.GetDecimal(10)));
                }
            }

            return orders.Select(item => new CashierOrder(
                item.Key,
                item.Value.TableNumber,
                item.Value.Status,
                item.Value.CustomerName,
                item.Value.CustomerWhatsapp,
                item.Value.Total,
                item.Value.CreatedAt,
                item.Value.Items)).ToArray();
        }
        catch (NpgsqlException exception)
        {
            throw new CashierStoreUnavailableException(exception);
        }
    }

    public async Task<CashierCommandResult> CloseAsync(
        Guid orderId,
        Guid actorId,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.staff_close_order($1, $2)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = orderId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = actorId });

            return (await command.ExecuteScalarAsync(cancellationToken))?.ToString() switch
            {
                "ok" => CashierCommandResult.Succeeded,
                "not_found" => CashierCommandResult.NotFound,
                "invalid_transition" => CashierCommandResult.InvalidTransition,
                "not_authorized" => CashierCommandResult.NotAuthorized,
                _ => throw new CashierStoreUnavailableException(),
            };
        }
        catch (NpgsqlException exception)
        {
            throw new CashierStoreUnavailableException(exception);
        }
    }

    public async Task<CashierCommandResult> SetAvailabilityAsync(
        Guid itemId,
        Guid actorId,
        bool isAvailable,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.staff_set_item_availability($1, $2, $3)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = itemId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = actorId });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Boolean, Value = isAvailable });

            return (await command.ExecuteScalarAsync(cancellationToken))?.ToString() switch
            {
                "ok" => CashierCommandResult.Succeeded,
                "not_found" => CashierCommandResult.NotFound,
                "not_authorized" => CashierCommandResult.NotAuthorized,
                _ => throw new CashierStoreUnavailableException(),
            };
        }
        catch (NpgsqlException exception)
        {
            throw new CashierStoreUnavailableException(exception);
        }
    }
}

public sealed class UnavailableCashierStore : ICashierStore
{
    public Task<IReadOnlyList<CashierOrder>> GetOrdersAsync(CancellationToken cancellationToken) =>
        throw new CashierStoreUnavailableException();

    public Task<CashierCommandResult> CloseAsync(
        Guid orderId,
        Guid actorId,
        CancellationToken cancellationToken) =>
        throw new CashierStoreUnavailableException();

    public Task<CashierCommandResult> SetAvailabilityAsync(
        Guid itemId,
        Guid actorId,
        bool isAvailable,
        CancellationToken cancellationToken) =>
        throw new CashierStoreUnavailableException();
}
