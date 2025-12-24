#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER app
WORKDIR /app
EXPOSE 8084

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files first for layer caching
COPY ["src/services/notification-service/Myb.Notification/Myb.Notification.csproj", "src/services/notification-service/Myb.Notification/"]

RUN dotnet restore "./src/services/notification-service/Myb.Notification/./Myb.Notification.csproj"

# Copy notification service files and common dependencies
COPY src/services/notification-service/ src/services/notification-service/
COPY src/common/ src/common/

WORKDIR "/src/src/services/notification-service/Myb.Notification"
RUN dotnet build "./Myb.Notification.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Myb.Notification.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Notification.dll"]
