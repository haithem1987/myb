#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
# Copy project files (payment project + its referenced projects) first to leverage layer caching
COPY ["src/services/payment-service/Myb.Payment/Myb.Payment.csproj", "src/services/payment-service/Myb.Payment/"]
COPY ["src/common/Myb.Common.Authentification/Myb.Common.Authentification.csproj", "src/common/Myb.Common.Authentification/"]
COPY ["src/services/payment-service/Myb.Payment.EntityFrameWork.Infra/Myb.Payment.EntityFrameWork.Infra.csproj", "src/services/payment-service/Myb.Payment.EntityFrameWork.Infra/"]

RUN dotnet restore "src/services/payment-service/Myb.Payment/Myb.Payment.csproj"

# Copy payment, common, and user-manager models (needed by Common.Authentification)
COPY src/services/payment-service/ src/services/payment-service/
COPY src/common/ src/common/
COPY src/services/user-manager/Myb.UserManager.Models/ src/services/user-manager/Myb.UserManager.Models/

WORKDIR "/src/src/services/payment-service/Myb.Payment"
RUN dotnet build "Myb.Payment.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR "/src/src/services/payment-service/Myb.Payment"
RUN dotnet publish "Myb.Payment.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Payment.dll"]
