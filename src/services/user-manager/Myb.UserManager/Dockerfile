#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER app
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files first for layer caching
COPY ["src/services/user-manager/Myb.UserManager/Myb.UserManager.csproj", "src/services/user-manager/Myb.UserManager/"]
COPY ["src/services/user-manager/Myb.UserManager.Models/Myb.UserManager.Models.csproj", "src/services/user-manager/Myb.UserManager.Models/"]
COPY ["src/services/user-manager/Myb.UserManager.Sevices/Myb.UserManager.Sevices.csproj", "src/services/user-manager/Myb.UserManager.Sevices/"]
COPY ["src/services/user-manager/Myb.UserManager.Data/Myb.UserManager.Data.csproj", "src/services/user-manager/Myb.UserManager.Data/"]

RUN dotnet restore "./src/services/user-manager/Myb.UserManager/./Myb.UserManager.csproj"

# Copy user-manager source files and common dependencies
COPY src/services/user-manager/ src/services/user-manager/
COPY src/common/ src/common/

WORKDIR "/src/src/services/user-manager/Myb.UserManager"
RUN dotnet build "./Myb.UserManager.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Myb.UserManager.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.UserManager.dll"]