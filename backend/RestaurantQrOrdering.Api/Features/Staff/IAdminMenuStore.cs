namespace RestaurantQrOrdering.Api.Features.Staff;

public interface IAdminMenuStore
{
    Task<Guid> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken);
    Task<AdminMenuCommandResult> UpdateCategoryAsync(Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken);
    Task<AdminMenuCommandResult> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken);
    Task<Guid> CreateItemAsync(CreateMenuItemRequest request, CancellationToken cancellationToken);
    Task<AdminMenuCommandResult> UpdateItemAsync(Guid itemId, UpdateMenuItemRequest request, CancellationToken cancellationToken);
    Task<AdminMenuCommandResult> DeleteItemAsync(Guid itemId, CancellationToken cancellationToken);
}

public sealed class AdminMenuStoreUnavailableException(Exception? innerException = null)
    : Exception("The admin menu store is unavailable.", innerException);
