FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8082

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy only project files first for better layer caching
COPY ["src/services/document-management/Myb.Document/Myb.Document.csproj", "src/services/document-management/Myb.Document/"]
COPY ["src/common/Myb.Common.Models/Myb.Common.Models.csproj", "src/common/Myb.Common.Models/"]
COPY ["src/common/Myb.Common.Repositories/Myb.Common.Repositories.csproj", "src/common/Myb.Common.Repositories/"]
COPY ["src/common/Myb.Common.Authentification/Myb.Common.Authentification.csproj", "src/common/Myb.Common.Authentification/"]
COPY ["src/common/Myb.Common.GraphQL.Infra/Myb.Common.GraphQL.Infra.csproj", "src/common/Myb.Common.GraphQL.Infra/"]
COPY ["src/common/Myb.Common.Utils/Myb.Common.Utils.csproj", "src/common/Myb.Common.Utils/"]
COPY ["src/common/Myb.Common.Stripe/Myb.Common.Stripe.csproj", "src/common/Myb.Common.Stripe/"]

# Copy document management project references
COPY ["src/services/document-management/Myb.Document.EntityFrameWork.Infra/Myb.Document.EntityFrameWork.Infra.csproj", "src/services/document-management/Myb.Document.EntityFrameWork.Infra/"]
COPY ["src/services/document-management/Myb.Document.Infra/Myb.Document.Infra.csproj", "src/services/document-management/Myb.Document.Infra/"]
COPY ["src/services/document-management/Myb.document.Model/Myb.document.Model.csproj", "src/services/document-management/Myb.document.Model/"]
COPY ["src/services/document-management/Myb.Document.Services/Myb.Document.Services.csproj", "src/services/document-management/Myb.Document.Services/"]

# Copy user-manager project references
COPY ["src/services/user-manager/Myb.UserManager.Models/Myb.UserManager.Models.csproj", "src/services/user-manager/Myb.UserManager.Models/"]
COPY ["src/services/user-manager/Myb.UserManager.EntityFrameWork.Infra/Myb.UserManager.EntityFrameWork.Infra.csproj", "src/services/user-manager/Myb.UserManager.EntityFrameWork.Infra/"]
COPY ["src/services/user-manager/Myb.UserManager.Infra/Myb.UserManager.Infra.csproj", "src/services/user-manager/Myb.UserManager.Infra/"]

# Copy timesheet project references (required by Myb.Common.GraphQL.Infra)
COPY ["src/services/time-sheet/Myb.Timesheet.Infra/Myb.Timesheet.Infra.csproj", "src/services/time-sheet/Myb.Timesheet.Infra/"]

# Restore dependencies (cached unless csproj changes)
RUN dotnet restore "src/services/document-management/Myb.Document/Myb.Document.csproj"

# Copy all source code
COPY src/services/document-management/ src/services/document-management/
COPY src/common/ src/common/
COPY src/services/user-manager/ src/services/user-manager/
COPY src/services/time-sheet/ src/services/time-sheet/

WORKDIR "/src/src/services/document-management/Myb.Document"
RUN dotnet build "Myb.Document.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Myb.Document.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Document.dll"]
