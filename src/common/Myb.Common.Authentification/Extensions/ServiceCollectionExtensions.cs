using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Authentification.Services;
using Myb.Common.Authentification.Interfaces;
using Myb.Common.Authentification.Settings;
using Microsoft.AspNetCore.Http;
namespace Myb.Common.Authentification.Extensions
{
    public static class ServiceCollectionExtensions
    { 
        public static void AddServices(this IServiceCollection services)
        { 
            services.AddHttpClient();
            services.AddScoped<IKeycloakTokenService, KeycloakTokenService>();
        }
    
        public static void AddKeycloakSettings(this WebApplicationBuilder builder) 
        {
            var keycloakSettings = builder.Configuration.GetSection("Keycloak");
            KeycloakSettings settings = new KeycloakSettings()
            {
                BaseUrl = keycloakSettings.GetSection("BaseUrl").Value,
                ClientId = keycloakSettings.GetSection("ClientId").Value,
                ClientSecret = keycloakSettings.GetSection("ClientSecret").Value,
            };
           builder.Services.AddSingleton<KeycloakSettings>(x=>settings);
        } 
        public static void AddKeycloakAuthorization(this WebApplicationBuilder builder)
        {
            var keycloakSettings = builder.Configuration.GetSection("Keycloak");
            KeycloakSettings settings = new KeycloakSettings()
            {
                BaseUrl = keycloakSettings.GetSection("BaseUrl").Value,
                ClientId = keycloakSettings.GetSection("ClientId").Value,
                ClientSecret = keycloakSettings.GetSection("ClientSecret").Value,
                Authority = keycloakSettings.GetSection("Authority").Value,
            };
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority = settings.Authority;
                    options.Audience = settings.ClientId;
                    options.RequireHttpsMetadata = false;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidIssuer = settings.Authority,
                        ValidateIssuer = true,
                        ValidAudiences = new[] { settings.ClientId, "account" },
                        ValidateAudience = true,
                        ValidateIssuerSigningKey = true,
                        //ClockSkew = TimeSpan.Zero // enable this line to validate the expiration time below 5mins
                    };
                    options.Events = new JwtBearerEvents()
                    {
                        OnAuthenticationFailed = c =>
                        {
                            c.NoResult();
                            return Task.CompletedTask;
                        }
                    };
                });
             builder.Services.AddAuthorization();

        } 
    }
}