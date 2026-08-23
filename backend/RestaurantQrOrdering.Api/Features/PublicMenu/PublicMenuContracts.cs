namespace RestaurantQrOrdering.Api.Features.PublicMenu;

public sealed record PublicMenuResponse(
    IReadOnlyList<PublicCategory> Categories,
    IReadOnlyList<PublicMenuItem> Items);

public sealed record PublicCategory(
    Guid Id,
    string NameEn,
    string NameAr,
    int SortOrder);

public sealed record PublicMenuItem(
    Guid Id,
    Guid CategoryId,
    string NameEn,
    string NameAr,
    string DescriptionEn,
    string DescriptionAr,
    decimal Price,
    string? ImageUrl,
    IReadOnlyList<string> Allergens,
    bool IsAvailable);
