
using Microsoft.EntityFrameworkCore;
using Myb.Invoice.Configuration;
using Myb.Invoice.EntityFrameWork.Infra;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureInvoiceModule();

var app = builder.Build();

// Auto-apply EF Core migrations on startup (with retry)
var contextFactory = app.Services.GetRequiredService<IDbContextFactory<InvoiceContext>>();
int retryCount = 0;
const int maxRetries = 5;
while (retryCount < maxRetries)
{
    try
    {
        using var dbContext = contextFactory.CreateDbContext();
        await dbContext.Database.MigrateAsync();
        break;
    }
    catch (Exception ex)
    {
        retryCount++;
        if (retryCount >= maxRetries)
            app.Logger.LogError(ex, "Failed to migrate invoice database after {retries} retries", maxRetries);
        else
        {
            app.Logger.LogWarning(ex, "Invoice DB migration failed, retrying ({attempt}/{max})...", retryCount, maxRetries);
            await Task.Delay(2000);
        }
    }
}

app.ConfigureInvoiceModuleApp();
app.Run();

