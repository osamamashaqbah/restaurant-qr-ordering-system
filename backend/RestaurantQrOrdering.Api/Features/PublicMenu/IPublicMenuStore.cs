namespace RestaurantQrOrdering.Api.Features.PublicMenu;

public interface IPublicMenuStore
{
    Task<PublicMenuResponse> GetAsync(CancellationToken cancellationToken);
}

public sealed class PublicMenuStoreUnavailableException : Exception
{
    public PublicMenuStoreUnavailableException(Exception? innerException = null)
        : base("The public menu store is not configured or unavailable.", innerException)
    {
    }
}
