using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Authentification.Extensions;
using Myb.Document.Configuration;
using Myb.Invoice.Configuration;
using Myb.Notification.Configuration;
using Myb.Timesheet.Configuration;

var builder = WebApplication.CreateBuilder(args);

//—— 1. Shared configuration ——
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// Register JWT authentication *once*
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "http://localhost:8080/realms/MYB";
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer   = "http://localhost:8080/realms/MYB",
            ValidateAudience = false,
            ValidateLifetime = true,
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // allow SignalR to send access_token in query string
                var token = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/notificationhub"))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.AddKeycloakSettings(); 
//—— 2. Compose feature modules ——
builder.ConfigureDocumentModule();
builder.ConfigureInvoiceModule(); 
builder.ConfigureNotificationModule();  
builder.ConfigureTimesheetModule();

var app = builder.Build();

//—— 3. Shared middleware pipeline ——
app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); 
    app.UseSwagger();
    app.UseSwaggerUI();
}

//—— 4. Compose feature endpoints ——
app.ConfigureDocumentModuleApp();
app.ConfigureTimesheetModuleApp();       
app.ConfigureInvoiceModuleApp();
app.ConfigureNotificationModuleApp();   
app.MapControllers();
app.Run();


