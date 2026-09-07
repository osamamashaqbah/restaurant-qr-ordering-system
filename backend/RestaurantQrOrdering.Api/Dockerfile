FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build
WORKDIR /src
COPY backend/RestaurantQrOrdering.Api/RestaurantQrOrdering.Api.csproj backend/RestaurantQrOrdering.Api/
RUN dotnet restore backend/RestaurantQrOrdering.Api/RestaurantQrOrdering.Api.csproj
COPY backend/RestaurantQrOrdering.Api/ backend/RestaurantQrOrdering.Api/
RUN dotnet publish backend/RestaurantQrOrdering.Api/RestaurantQrOrdering.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "RestaurantQrOrdering.Api.dll"]
