#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/services/time-sheet/Myb.Timesheet/Myb.Timesheet.csproj", "src/services/time-sheet/Myb.Timesheet/"]
COPY ["src/services/time-sheet/Myb.Timesheet.Models/Myb.Timesheet.Models.csproj", "src/services/time-sheet/Myb.Timesheet.Models/"]
COPY ["src/services/time-sheet/Myb.Timesheet.Services/Myb.Timesheet.Services.csproj", "src/services/time-sheet/Myb.Timesheet.Services/"]
COPY ["src/services/time-sheet/Myb.Timesheet.Infra/Myb.Timesheet.Infra.csproj", "src/services/time-sheet/Myb.Timesheet.Infra/"]
COPY ["src/services/time-sheet/Myb.Timesheet.EntityFrameWork.Infra/Myb.Timesheet.EntityFrameWork.Infra.csproj", "src/services/time-sheet/Myb.Timesheet.EntityFrameWork.Infra/"]
RUN dotnet restore "./src/services/time-sheet/Myb.Timesheet/./Myb.Timesheet.csproj"
COPY . .
WORKDIR "/src/src/services/time-sheet/Myb.Timesheet"
RUN dotnet build "./Myb.Timesheet.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Myb.Timesheet.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Timesheet.dll"]
