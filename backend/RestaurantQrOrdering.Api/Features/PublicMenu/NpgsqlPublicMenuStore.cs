using Npgsql;

namespace RestaurantQrOrdering.Api.Features.PublicMenu;

public sealed class NpgsqlPublicMenuStore(NpgsqlDataSource dataSource) : IPublicMenuStore
{
    public async Task<PublicMenuResponse> GetAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                select
                  c.id, c.name_en, c.name_ar, c.sort_order,
                  mi.id, mi.category_id, mi.name_en, mi.name_ar,
                  mi.description_en, mi.description_ar, mi.price,
                  mi.image_url, mi.allergens, mi.is_available
                from public.categories c
                left join public.menu_items mi on mi.category_id = c.id
                order by c.sort_order, c.name_en, mi.name_en
                """);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            var categories = new Dictionary<Guid, PublicCategory>();
            var items = new List<PublicMenuItem>();
            while (await reader.ReadAsync(cancellationToken))
            {
                var categoryId = reader.GetGuid(0);
                categories.TryAdd(
                    categoryId,
                    new PublicCategory(
                        categoryId,
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.GetInt32(3)));

                if (reader.IsDBNull(4))
                    continue;

                items.Add(new PublicMenuItem(
                    reader.GetGuid(4),
                    reader.GetGuid(5),
                    reader.GetString(6),
                    reader.GetString(7),
                    reader.GetString(8),
                    reader.GetString(9),
                    reader.GetDecimal(10),
                    reader.IsDBNull(11) ? null : reader.GetString(11),
                    reader.GetFieldValue<string[]>(12),
                    reader.GetBoolean(13)));
            }

            return new PublicMenuResponse(categories.Values.ToArray(), items);
        }
        catch (NpgsqlException exception)
        {
            throw new PublicMenuStoreUnavailableException(exception);
        }
    }
}

public sealed class UnavailablePublicMenuStore : IPublicMenuStore
{
    public Task<PublicMenuResponse> GetAsync(CancellationToken cancellationToken) =>
        throw new PublicMenuStoreUnavailableException();
}
