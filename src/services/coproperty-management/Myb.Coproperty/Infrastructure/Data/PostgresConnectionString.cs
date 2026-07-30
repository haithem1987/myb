using Npgsql;

namespace Myb.Coproperty.Infrastructure.Data;

internal static class PostgresConnectionString
{
    public static string Resolve(IConfiguration configuration)
    {
        // Railway exposes PostgreSQL as DATABASE_URL. Prefer the service-specific
        // setting when present, but do not silently fall back to localhost in
        // production when Railway has supplied its standard variable.
        var value = configuration.GetConnectionString("CopropertyDBConnection")
                    ?? configuration["DATABASE_URL"]
                    ?? configuration["DATABASE_PUBLIC_URL"]
                    ?? configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                "No coproperty database connection is configured. Set " +
                "ConnectionStrings__CopropertyDBConnection or DATABASE_URL.");
        }

        value = value.Trim();
        if (value.Length >= 2 &&
            ((value[0] == '"' && value[^1] == '"') ||
             (value[0] == '\'' && value[^1] == '\'')))
        {
            value = value[1..^1].Trim();
        }

        if (value.Contains("${{", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "The coproperty database connection contains an unresolved Railway variable reference.");
        }

        if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            // Validate at startup and return a normalized Npgsql connection string.
            return new NpgsqlConnectionStringBuilder(value).ConnectionString;
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri))
        {
            throw new InvalidOperationException("The PostgreSQL DATABASE_URL is not a valid URI.");
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length == 2 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty
        };

        foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            var key = Uri.UnescapeDataString(parts[0]);
            var queryValue = parts.Length == 2 ? Uri.UnescapeDataString(parts[1]) : string.Empty;

            // Preserve standard PostgreSQL URL options such as sslmode=require.
            if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
                builder["SSL Mode"] = queryValue;
        }

        return builder.ConnectionString;
    }
}
