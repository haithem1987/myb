using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Authentification.Services;
using Myb.Common.Authentification.Interfaces;
using Myb.Common.Authentification.Settings;
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
            IdentityModelEventSource.ShowPII = true; 

 

            builder.Services
                .AddAuthentication(option =>
                {
                    option.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    option.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                    option.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                }) 
                .AddJwtBearer(options =>
                {
                    options.Authority = "https://www.keycloak.forlink-group.com/realms/MYB";
                    options.SaveToken = false;
                    options.RequireHttpsMetadata = false; 
                    options.TokenValidationParameters = new TokenValidationParameters()
                    {
                        ValidateIssuer = true,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = "https://www.keycloak.forlink-group.com/realms/MYB"
                    };
                }); 
            
            builder.Services.AddAuthorization();

        } 
    }
}