using Npgsql;
using NpgsqlTypes;

namespace RestaurantQrOrdering.Api.Features.Staff;

public sealed class NpgsqlAdminMenuStore(NpgsqlDataSource dataSource) : IAdminMenuStore
{
    public async Task<Guid> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                insert into public.categories (name_en, name_ar, sort_order)
                values ($1, $2, $3)
                returning id
                """);
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.NameEn.Trim() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.NameAr.Trim() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Integer, Value = request.SortOrder });
            return (Guid)(await command.ExecuteScalarAsync(cancellationToken)
                ?? throw new AdminMenuStoreUnavailableException());
        }
        catch (NpgsqlException exception)
        {
            throw new AdminMenuStoreUnavailableException(exception);
        }
    }

    public Task<AdminMenuCommandResult> UpdateCategoryAsync(Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken) =>
        ExecuteCategoryUpdateAsync(categoryId, request, cancellationToken);

    private async Task<AdminMenuCommandResult> ExecuteCategoryUpdateAsync(Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                update public.categories
                set name_en = $1, name_ar = $2, sort_order = $3
                where id = $4
                """);
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.NameEn.Trim() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.NameAr.Trim() });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Integer, Value = request.SortOrder });
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = categoryId });
            return await command.ExecuteNonQueryAsync(cancellationToken) == 0
                ? AdminMenuCommandResult.NotFound
                : AdminMenuCommandResult.Succeeded;
        }
        catch (NpgsqlException exception)
        {
            throw new AdminMenuStoreUnavailableException(exception);
        }
    }

    public async Task<AdminMenuCommandResult> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("delete from public.categories where id = $1");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = categoryId });
            return await command.ExecuteNonQueryAsync(cancellationToken) == 0
                ? AdminMenuCommandResult.NotFound
                : AdminMenuCommandResult.Succeeded;
        }
        catch (PostgresException exception) when (exception.SqlState == "23503")
        {
            return AdminMenuCommandResult.Conflict;
        }
        catch (NpgsqlException exception)
        {
            throw new AdminMenuStoreUnavailableException(exception);
        }
    }

    public async Task<Guid> CreateItemAsync(CreateMenuItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                insert into public.menu_items
                  (category_id, name_en, name_ar, description_en, description_ar, price, image_url, allergens, is_available)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                returning id
                """);
            AddItemParameters(command, request);
            return (Guid)(await command.ExecuteScalarAsync(cancellationToken)
                ?? throw new AdminMenuStoreUnavailableException());
        }
        catch (NpgsqlException exception)
        {
            throw new AdminMenuStoreUnavailableException(exception);
        }
    }

    public async Task<AdminMenuCommandResult> UpdateItemAsync(Guid itemId, UpdateMenuItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("""
                update public.menu_items set
                  category_id = $1, name_en = $2, name_ar = $3, description_en = $4,
                  description_ar = $5, price = $6, image_url = $7, allergens = $8, is_available = $9
                where id = $10
                """);
            AddItemParameters(command, request);
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = itemId });
            return await command.ExecuteNonQueryAsync(cancellationToken) == 0
                ? AdminMenuCommandResult.NotFound
                : AdminMenuCommandResult.Succeeded;
        }
        catch (NpgsqlException exception)
        {
            throw new AdminMenuStoreUnavailableException(exception);
        }
    }

    public async Task<AdminMenuCommandResult> DeleteItemAsync(Guid itemId, CancellationToken cancellationToken)
    {
        try
        {
            await using var command = dataSource.CreateCommand("delete from public.menu_items where id = $1");
            command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = itemId });
            return await command.ExecuteNonQueryAsync(cancellationToken) == 0
                ? AdminMenuCommandResult.NotFound
                : AdminMenuCommandResult.Succeeded;
        }
        catch (NpgsqlException exception)
        {
            throw new AdminMenuStoreUnavailableException(exception);
        }
    }

    private static void AddItemParameters(NpgsqlCommand command, CreateMenuItemRequest request)
    {
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Uuid, Value = request.CategoryId });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.NameEn.Trim() });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.NameAr.Trim() });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.DescriptionEn.Trim() });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = request.DescriptionAr.Trim() });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Numeric, Value = request.Price });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Text, Value = (object?)request.ImageUrl?.Trim() ?? DBNull.Value });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Array | NpgsqlDbType.Text, Value = request.Allergens });
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType = NpgsqlDbType.Boolean, Value = request.IsAvailable });
    }
}

public sealed class UnavailableAdminMenuStore : IAdminMenuStore
{
    public Task<Guid> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken) => throw new AdminMenuStoreUnavailableException();
    public Task<AdminMenuCommandResult> UpdateCategoryAsync(Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken) => throw new AdminMenuStoreUnavailableException();
    public Task<AdminMenuCommandResult> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken) => throw new AdminMenuStoreUnavailableException();
    public Task<Guid> CreateItemAsync(CreateMenuItemRequest request, CancellationToken cancellationToken) => throw new AdminMenuStoreUnavailableException();
    public Task<AdminMenuCommandResult> UpdateItemAsync(Guid itemId, UpdateMenuItemRequest request, CancellationToken cancellationToken) => throw new AdminMenuStoreUnavailableException();
    public Task<AdminMenuCommandResult> DeleteItemAsync(Guid itemId, CancellationToken cancellationToken) => throw new AdminMenuStoreUnavailableException();
}
