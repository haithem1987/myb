FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/services/mailer-service/Myb.Mailer/Myb.Mailer.csproj", "src/services/mailer-service/Myb.Mailer/"]
COPY ["src/common/Myb.Common.Messaging/Myb.Common.Messaging.csproj", "src/common/Myb.Common.Messaging/"]

RUN dotnet restore "./src/services/mailer-service/Myb.Mailer/Myb.Mailer.csproj"

COPY src/services/mailer-service/ src/services/mailer-service/
COPY src/common/Myb.Common.Messaging/ src/common/Myb.Common.Messaging/

WORKDIR "/src/src/services/mailer-service/Myb.Mailer"
RUN dotnet build "./Myb.Mailer.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Myb.Mailer.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Mailer.dll"]
