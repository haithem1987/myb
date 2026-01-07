# Environment Configuration Guide

## Overview

All MYB backend services are now configured using environment variables defined in the `.env` file. This provides a centralized, secure, and flexible way to manage configuration across all microservices.

## Configuration File Structure

### Primary Configuration File: `.env`

The `.env` file located at the root of the project contains all environment variables used by the application. This file should **NOT** be committed to version control (it's in .gitignore).

## Environment Variables Reference

### Frontend Configuration
- `FRONTEND_URL` - Primary frontend URL (default: `http://localhost:4200`)
- `FRONTEND_URL_ALT` - Alternative frontend URL (default: `http://localhost:4201`)

### Keycloak Configuration
- `KEYCLOAK_HOST` - Keycloak server host (default: `localhost`)
- `KEYCLOAK_PORT` - Keycloak server port (default: `8080`)
- `KEYCLOAK_REALM` - Keycloak realm name (default: `MYB`)
- `KEYCLOAK_BASE_URL` - Full base URL for Keycloak OpenID Connect
- `KEYCLOAK_AUTHORITY` - Keycloak authority URL for authentication
- `KEYCLOAK_CLIENT_ID` - OAuth client ID (default: `MYB-client`)
- `KEYCLOAK_CLIENT_SECRET` - OAuth client secret
- `KEYCLOAK_ADMIN_USER` - Keycloak admin username (default: `admin`)
- `KEYCLOAK_ADMIN_PASSWORD` - Keycloak admin password

### Database Configuration

Each service has its own database with the following environment variables:

#### Keycloak Database
- `KEYCLOAK_DB_HOST`, `KEYCLOAK_DB_PORT`, `KEYCLOAK_DB_NAME`
- `KEYCLOAK_DB_USER`, `KEYCLOAK_DB_PASSWORD`

#### Timesheet Database
- `TIMESHEET_DB_HOST`, `TIMESHEET_DB_PORT`, `TIMESHEET_DB_NAME`
- `TIMESHEET_DB_USER`, `TIMESHEET_DB_PASSWORD`

#### Document Database
- `DOCUMENT_DB_HOST`, `DOCUMENT_DB_PORT`, `DOCUMENT_DB_NAME`
- `DOCUMENT_DB_USER`, `DOCUMENT_DB_PASSWORD`

#### Invoice Database
- `INVOICE_DB_HOST`, `INVOICE_DB_PORT`, `INVOICE_DB_NAME`
- `INVOICE_DB_USER`, `INVOICE_DB_PASSWORD`

#### User Database
- `USER_DB_HOST`, `USER_DB_PORT`, `USER_DB_NAME`
- `USER_DB_USER`, `USER_DB_PASSWORD`

#### Payment Database
- `PAYMENT_DB_HOST`, `PAYMENT_DB_PORT`, `PAYMENT_DB_NAME`
- `PAYMENT_DB_USER`, `PAYMENT_DB_PASSWORD`

#### Notification Database
- `NOTIFICATION_DB_HOST`, `NOTIFICATION_DB_PORT`, `NOTIFICATION_DB_NAME`
- `NOTIFICATION_DB_USER`, `NOTIFICATION_DB_PASSWORD`

### CORS Configuration
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins for CORS
  - Example: `http://localhost:4200,http://localhost:4201,http://localhost:8080`

### External Services

#### Stripe (Payment Service)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

#### SendGrid (Email Service)
- `SENDGRID_API_KEY` - SendGrid API key for email notifications
- `EMAIL_FROM_ADDRESS` - Default sender email address

### Application Environment
- `ASPNETCORE_ENVIRONMENT` - ASP.NET Core environment (Development/Production)
- `NODE_ENV` - Node.js environment for frontend (production/development)

## How Configuration Works

### 1. appsettings.json Files

Each service's `appsettings.json` file now uses placeholders for environment variables:

```json
{
  "ConnectionStrings": {
    "TimesheetDBConnection": "Host=${TIMESHEET_DB_HOST};Port=${TIMESHEET_DB_PORT};Database=${TIMESHEET_DB_NAME};Username=${TIMESHEET_DB_USER};Password=${TIMESHEET_DB_PASSWORD}"
  },
  "Keycloak": {
    "BaseUrl": "${KEYCLOAK_BASE_URL}",
    "ClientId": "${KEYCLOAK_CLIENT_ID}",
    "ClientSecret": "${KEYCLOAK_CLIENT_SECRET}",
    "Authority": "${KEYCLOAK_AUTHORITY}"
  },
  "Cors": {
    "AllowedOrigins": "${CORS_ALLOWED_ORIGINS}"
  }
}
```

### 2. Program.cs Files

Service entry points (Program.cs) have been updated to read configuration from appsettings.json:

```csharp
// Example: Reading CORS configuration
var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',') 
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});
```

### 3. docker-compose.yml

The docker-compose file passes environment variables to each service:

```yaml
myb-timesheet:
  environment:
    - ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT:-Development}
    - ConnectionStrings__TimesheetDBConnection=Host=timesheetDB;Port=5432;...
    - Keycloak__BaseUrl=${KEYCLOAK_BASE_URL}
    - Keycloak__Authority=${KEYCLOAK_AUTHORITY}
    - Cors__AllowedOrigins=${CORS_ALLOWED_ORIGINS}
```

## Usage Instructions

### Local Development

1. **Copy the .env file** (if you don't have one):
   ```bash
   cp .env.example .env
   ```

2. **Update values in .env** according to your local setup

3. **Run services**:
   ```bash
   # Using docker-compose
   docker-compose up
   
   # Or running services individually
   dotnet run --project src/services/time-sheet/Myb.Timesheet
   ```

### Docker Deployment

Environment variables are automatically loaded from the `.env` file when using docker-compose:

```bash
docker-compose up -d
```

### Production Deployment

For production:

1. **DO NOT commit .env to version control**
2. Set environment variables directly in your hosting environment (Azure App Service, AWS, Kubernetes, etc.)
3. Override values using:
   - Azure App Service: Application Settings
   - AWS: Parameter Store or Secrets Manager
   - Kubernetes: ConfigMaps and Secrets
   - Docker: Environment variables in compose file or container runtime

## Configuration Priority

ASP.NET Core configuration follows this priority (highest to lowest):

1. Command-line arguments
2. Environment variables
3. appsettings.{Environment}.json
4. appsettings.json
5. Default values in code

## Security Best Practices

1. **Never commit sensitive values** to version control
2. **Use different secrets** for each environment (dev, staging, production)
3. **Rotate secrets regularly**, especially for production
4. **Limit access** to .env files and configuration management systems
5. **Use secret management services** for production (Azure Key Vault, AWS Secrets Manager, etc.)

## Troubleshooting

### Environment Variables Not Loading

1. Check that .env file exists in project root
2. Verify environment variable syntax (no spaces around `=`)
3. Restart services after changing .env
4. Check docker-compose logs for configuration errors

### Connection String Issues

1. Verify database host names (use service names in docker-compose)
2. Check port mappings
3. Ensure database services are healthy before starting application services
4. Verify credentials match database configuration

### CORS Errors

1. Check `CORS_ALLOWED_ORIGINS` includes your frontend URL
2. Verify comma-separated format (no spaces)
3. Include protocol (http:// or https://)
4. Restart backend services after changing CORS configuration

## Adding New Configuration

To add a new configuration variable:

1. **Add to .env file**:
   ```bash
   NEW_CONFIG_VALUE=your_value
   ```

2. **Update appsettings.json**:
   ```json
   {
     "NewSection": {
       "ConfigValue": "${NEW_CONFIG_VALUE}"
     }
   }
   ```

3. **Read in C# code**:
   ```csharp
   var configValue = builder.Configuration["NewSection:ConfigValue"];
   ```

4. **Update docker-compose.yml** (if needed):
   ```yaml
   environment:
     - NewSection__ConfigValue=${NEW_CONFIG_VALUE}
   ```

## Services Configuration Summary

| Service | Port | Database | Key Configurations |
|---------|------|----------|-------------------|
| Keycloak | 8080 | keycloak-db:5450 | Admin credentials, Realm |
| UserManager | 8087 | timesheetDB:5448 | Keycloak, User DB |
| Timesheet | 8082 | timesheetDB:5448 | Keycloak, CORS |
| Document | 8086 | documentDB:5433 | Keycloak, CORS |
| Invoice | 8083 | invoiceDB:5434 | Keycloak, CORS |
| Payment | 8084 | (TBD) | Keycloak, Stripe, CORS |
| Notification | 8085 | (TBD) | Keycloak, SendGrid, CORS |
| Frontend | 4200 | N/A | Node environment |

## Support

For configuration issues or questions, refer to:
- Project README.md
- Individual service documentation
- ASP.NET Core Configuration documentation: https://docs.microsoft.com/aspnet/core/fundamentals/configuration/
