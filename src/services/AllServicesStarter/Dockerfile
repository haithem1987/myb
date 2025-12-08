# ---------- Base runtime image ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8082

# ---------- Build & publish image (multi‑arch) ----------
FROM --platform=${BUILDPLATFORM} mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy everything so that all ProjectReferences exist
COPY . .

# Restore only the Starter project
RUN dotnet restore src/services/AllServicesStarter/AllServicesStarter.csproj

# Publish the Starter for linux‑x64
WORKDIR /src/src/services/AllServicesStarter
RUN dotnet publish AllServicesStarter.csproj \
    -c $BUILD_CONFIGURATION \
    -r linux‑x64 \
    -o /app_publish \
    --self-contained false \
    /p:UseAppHost=false

# ---------- Final runtime image ----------
FROM base AS final
WORKDIR /app

COPY --from=build /app_publish .

ENTRYPOINT ["dotnet", "AllServicesStarter.dll"]
