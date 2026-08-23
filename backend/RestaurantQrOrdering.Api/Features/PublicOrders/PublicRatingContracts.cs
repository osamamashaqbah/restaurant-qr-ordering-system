using System.ComponentModel.DataAnnotations;

namespace RestaurantQrOrdering.Api.Features.PublicOrders;

public sealed class PublicRatingRequest
{
    [Range(1, 5)]
    public int Stars { get; init; }

    [StringLength(500)]
    public string Comment { get; init; } = string.Empty;
}

public enum PublicRatingResult
{
    Succeeded,
    NotFound,
    AlreadyRated,
}
