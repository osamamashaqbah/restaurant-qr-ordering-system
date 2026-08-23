using System.ComponentModel.DataAnnotations;

namespace RestaurantQrOrdering.Api.Features.Staff;

public class CreateCategoryRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string NameEn { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string NameAr { get; init; } = string.Empty;

    public int SortOrder { get; init; }
}

public sealed class UpdateCategoryRequest : CreateCategoryRequest;

public class CreateMenuItemRequest
{
    [Required]
    public Guid CategoryId { get; init; }

    [Required, StringLength(150, MinimumLength = 1)]
    public string NameEn { get; init; } = string.Empty;

    [Required, StringLength(150, MinimumLength = 1)]
    public string NameAr { get; init; } = string.Empty;

    [StringLength(1000)]
    public string DescriptionEn { get; init; } = string.Empty;

    [StringLength(1000)]
    public string DescriptionAr { get; init; } = string.Empty;

    [Range(0, 1000000)]
    public decimal Price { get; init; }

    [StringLength(500)]
    public string? ImageUrl { get; init; }

    public string[] Allergens { get; init; } = [];

    public bool IsAvailable { get; init; } = true;
}

public sealed class UpdateMenuItemRequest : CreateMenuItemRequest;

public enum AdminMenuCommandResult
{
    Succeeded,
    NotFound,
    Conflict,
}
