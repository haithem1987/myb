FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app

EXPOSE 8082

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/services/document-management/Myb.Document/Myb.Document.csproj", "src/services/document-management/Myb.Document/"]
RUN dotnet restore "src/services/document-management/Myb.Document/Myb.Document.csproj"
COPY . .
WORKDIR "/src/src/services/document-management/Myb.Document"
RUN dotnet build "Myb.Document.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Myb.Document.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Document.dll"]
