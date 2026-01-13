FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8088

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy only project files first for better layer caching
COPY ["src/services/coproperty-management/Myb.Coproperty/Myb.Coproperty.csproj", "src/services/coproperty-management/Myb.Coproperty/"]
COPY ["src/common/Myb.Common.Models/Myb.Common.Models.csproj", "src/common/Myb.Common.Models/"]
COPY ["src/common/Myb.Common.Repositories/Myb.Common.Repositories.csproj", "src/common/Myb.Common.Repositories/"]
COPY ["src/common/Myb.Common.Authentification/Myb.Common.Authentification.csproj", "src/common/Myb.Common.Authentification/"]
COPY ["src/common/Myb.Common.GraphQL.Infra/Myb.Common.GraphQL.Infra.csproj", "src/common/Myb.Common.GraphQL.Infra/"]
COPY ["src/common/Myb.Common.Utils/Myb.Common.Utils.csproj", "src/common/Myb.Common.Utils/"]

# Copy user-manager project references
COPY ["src/services/user-manager/Myb.UserManager.Models/Myb.UserManager.Models.csproj", "src/services/user-manager/Myb.UserManager.Models/"]

# Copy timesheet project references (required by Myb.Common.GraphQL.Infra)
COPY ["src/services/time-sheet/Myb.Timesheet.Infra/Myb.Timesheet.Infra.csproj", "src/services/time-sheet/Myb.Timesheet.Infra/"]

# Restore dependencies (cached unless csproj changes)
RUN dotnet restore "src/services/coproperty-management/Myb.Coproperty/Myb.Coproperty.csproj"

# Copy all source code
COPY src/services/coproperty-management/ src/services/coproperty-management/
COPY src/common/ src/common/
COPY src/services/user-manager/ src/services/user-manager/
COPY src/services/time-sheet/ src/services/time-sheet/

WORKDIR "/src/src/services/coproperty-management/Myb.Coproperty"
RUN dotnet build "Myb.Coproperty.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Myb.Coproperty.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Coproperty.dll"]
