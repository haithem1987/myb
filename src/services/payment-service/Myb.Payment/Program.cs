using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
    options.UseNpgsql(builder.Configuration.GetConnectionString("PaymentDBConnection")));

builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddEmailPublisher();
builder.AddKeycloakSettings();
builder.AddKeycloakAuthorization();
builder.AddMybApiSecurity();
builder.Services.AddServices();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();
app.UseMybApiSecurity();
app.MapOpenApi();

// Auto-migrate payment database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentContext>();
    try
    {
        await db.Database.MigrateAsync();
    }
    catch
    {
        // If no migrations exist, ensure the DB is created
        await db.Database.EnsureCreatedAsync();
    }
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireAuthorization();

app.Run();
