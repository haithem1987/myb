using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Myb.Common.Authentification.Extensions;
using Myb.Common.Authentification.Security;
using Myb.Common.Messaging;
using Myb.Payment;
using Myb.Payment.EntityFrameWork.Infra;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = null; 
    });


builder.Services.AddDbContext<PaymentContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PaymentDBConnection"),
        npgsql => npgsql.MigrationsHistoryTable("__PaymentMigrationsHistory")));

builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddSingleton<IBankStatementParser, BankStatementParser>();
builder.Services.AddSingleton<IReconciliationEngine, ReconciliationEngine>();
builder.Services.AddEmailPublisher();
builder.AddKeycloakSettings();
builder.AddKeycloakAuthorization();
builder.AddMybApiSecurity();
builder.Services.AddServices();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

var app = builder.Build();
app.UseMybApiSecurity();
app.MapOpenApi();

// Auto-migrate payment database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentContext>();
    await db.Database.MigrateAsync();
}

// Seed test data in Development (matches test-bank-statement.ofx amounts)
if (app.Environment.IsDevelopment())
{
    await DevDataSeeder.SeedAsync(app.Services);
    // Bypass Keycloak when header "X-Dev-Auth: bypass" is present
    app.UseMiddleware<DevAuthMiddleware>();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers().RequireAuthorization();

app.Run();
