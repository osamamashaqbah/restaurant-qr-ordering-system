using Npgsql;
using NpgsqlTypes;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public sealed class NpgsqlPublicRatingStore(NpgsqlDataSource dataSource) : IPublicRatingStore
{
    public async Task<PublicRatingResult> SubmitAsync(
        ReadOnlyMemory<byte> tokenHash,
        int stars,
        string comment,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand(
                "select public.submit_rating_by_tracking_token($1, $2, $3)");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Bytea, Value = tokenHash.ToArray() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Integer, Value = stars });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = comment.Trim() });

            return (await command.ExecuteScalarAsync(cancellationToken))?.ToString() switch
            {
                "ok" => PublicRatingResult.Succeeded,
                "not_found" => PublicRatingResult.NotFound,
                "already_rated" => PublicRatingResult.AlreadyRated,
                _ => throw new PublicRatingStoreUnavailableException(),
            };
        }
        catch (NpgsqlException exception)
        {
            throw new PublicRatingStoreUnavailableException(exception);
        }
    }
}

public sealed class UnavailablePublicRatingStore : IPublicRatingStore
{
    public Task<PublicRatingResult> SubmitAsync(
        ReadOnlyMemory<byte> tokenHash,
        int stars,
        string comment,
        CancellationToken cancellationToken) =>
        throw new PublicRatingStoreUnavailableException();
}
