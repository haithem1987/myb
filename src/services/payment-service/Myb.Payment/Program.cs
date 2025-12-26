using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Myb.Common.Authentification.Extensions;
using Myb.Payment;
using Myb.Payment.EntityFrameWork.Infra;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPaymentOrigins", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:4201", "http://localhost:8080")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = null; 
    });


builder.Services.AddDbContext<PaymentContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PaymentDBConnection")));

builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.AddKeycloakSettings();
builder.AddKeycloakAuthorization();  // Add JWT authentication
builder.Services.AddServices();
builder.Services.AddEndpointsApiExplorer();
// Swagger temporarily disabled due to version compatibility
// builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseCors("AllowPaymentOrigins");
app.UseAuthentication();
app.UseAuthorization();
// app.UseSwagger();
// app.UseSwaggerUI(c =>
// {
//     c.SwaggerEndpoint("/swagger/v1/swagger.json", "Payment API V1");
// });

// Note: HttpsRedirection disabled for local dev (HTTP only)
// app.UseHttpsRedirection();
app.MapControllers();

app.Run();