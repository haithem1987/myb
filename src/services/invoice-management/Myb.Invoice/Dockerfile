FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8083

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy only project files first for better layer caching
COPY ["src/services/invoice-management/Myb.Invoice/Myb.Invoice.csproj", "src/services/invoice-management/Myb.Invoice/"]
COPY ["src/common/Myb.Common.Models/Myb.Common.Models.csproj", "src/common/Myb.Common.Models/"]
COPY ["src/common/Myb.Common.Repositories/Myb.Common.Repositories.csproj", "src/common/Myb.Common.Repositories/"]
COPY ["src/common/Myb.Common.Authentification/Myb.Common.Authentification.csproj", "src/common/Myb.Common.Authentification/"]
COPY ["src/common/Myb.Common.GraphQL.Infra/Myb.Common.GraphQL.Infra.csproj", "src/common/Myb.Common.GraphQL.Infra/"]
COPY ["src/common/Myb.Common.Utils/Myb.Common.Utils.csproj", "src/common/Myb.Common.Utils/"]
COPY ["src/common/Myb.Common.Stripe/Myb.Common.Stripe.csproj", "src/common/Myb.Common.Stripe/"]

# Copy invoice management project references
COPY ["src/services/invoice-management/Myb.Invoice.EntityFrameWork.Infra/Myb.Invoice.EntityFrameWork.Infra.csproj", "src/services/invoice-management/Myb.Invoice.EntityFrameWork.Infra/"]
COPY ["src/services/invoice-management/Myb.Invoice.Infra/Myb.Invoice.Infra.csproj", "src/services/invoice-management/Myb.Invoice.Infra/"]
COPY ["src/services/invoice-management/Myb.Invoice.Models/Myb.Invoice.Models.csproj", "src/services/invoice-management/Myb.Invoice.Models/"]
COPY ["src/services/invoice-management/Myb.Invoice.Services/Myb.Invoice.Services.csproj", "src/services/invoice-management/Myb.Invoice.Services/"]

# Copy user-manager project references
COPY ["src/services/user-manager/Myb.UserManager.Models/Myb.UserManager.Models.csproj", "src/services/user-manager/Myb.UserManager.Models/"]

# Copy timesheet project references (required by Myb.Common.GraphQL.Infra)
COPY ["src/services/time-sheet/Myb.Timesheet.Infra/Myb.Timesheet.Infra.csproj", "src/services/time-sheet/Myb.Timesheet.Infra/"]

# Restore dependencies (cached unless csproj changes)
RUN dotnet restore "src/services/invoice-management/Myb.Invoice/Myb.Invoice.csproj"

# Copy all source code
COPY src/services/invoice-management/ src/services/invoice-management/
COPY src/common/ src/common/
COPY src/services/user-manager/ src/services/user-manager/
COPY src/services/time-sheet/ src/services/time-sheet/

WORKDIR "/src/src/services/invoice-management/Myb.Invoice"
RUN dotnet build "Myb.Invoice.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Myb.Invoice.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Invoice.dll"]
