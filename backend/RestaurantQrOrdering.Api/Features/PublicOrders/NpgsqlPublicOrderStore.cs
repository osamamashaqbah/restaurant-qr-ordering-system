using System.Text.Json;
using Npgsql;
using NpgsqlTypes;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public sealed class NpgsqlPublicOrderStore(NpgsqlDataSource dataSource) : IPublicOrderStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<Guid> CreateAsync(
        CreateOrderRequest request,
        ReadOnlyMemory<byte> tokenHash,
        ReadOnlyMemory<byte> requestHash,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.create_order_with_tracking_token($1, $2, $3, $4, $5, $6)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.CustomerName.Trim() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.CustomerWhatsapp.Trim() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.TableNumber.Trim() });
            command.Parameters.Add(new NpgsqlParameter
            {
                NpgsqlDbType = NpgsqlDbType.Jsonb,
                Value = JsonSerializer.Serialize(
                    request.Items.Select(item => new
                    {
                        menu_item_id = item.MenuItemId,
                        quantity = item.Quantity,
                        notes = item.Notes ?? string.Empty,
                    }),
                    JsonOptions),
            });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Bytea, Value = tokenHash.ToArray() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Bytea, Value = requestHash.ToArray() });

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return result is Guid orderId
                ? orderId
                : throw new PublicOrderStoreUnavailableException();
        }
        catch (PostgresException exception) when (exception.SqlState == "P0001" && exception.MessageText == "Idempotency key reused")
        {
            throw new PublicOrderIdempotencyConflictException();
        }
        catch (NpgsqlException exception)
        {
            throw new PublicOrderStoreUnavailableException(exception);
        }
    }

    public async Task<PublicOrderTracking?> FindByTokenHashAsync(
        ReadOnlyMemory<byte> tokenHash,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.get_public_order_by_tracking_token($1)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Bytea, Value = tokenHash.ToArray() });

            var result = await command.ExecuteScalarAsync(cancellationToken);
            if (result is null or DBNull)
                return null;

            return JsonSerializer.Deserialize<PublicOrderTracking>(result.ToString()!, JsonOptions)
                ?? throw new PublicOrderStoreUnavailableException();
        }
        catch (NpgsqlException exception)
        {
            throw new PublicOrderStoreUnavailableException(exception);
        }
        catch (JsonException exception)
        {
            throw new PublicOrderStoreUnavailableException(exception);
        }
    }
}

public sealed class UnavailablePublicOrderStore : IPublicOrderStore
{
    public Task<Guid> CreateAsync(
        CreateOrderRequest request,
        ReadOnlyMemory<byte> tokenHash,
        ReadOnlyMemory<byte> requestHash,
        CancellationToken cancellationToken) =>
        throw new PublicOrderStoreUnavailableException();

    public Task<PublicOrderTracking?> FindByTokenHashAsync(ReadOnlyMemory<byte> tokenHash, CancellationToken cancellationToken) =>
        throw new PublicOrderStoreUnavailableException();
}
