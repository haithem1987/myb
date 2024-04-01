using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Authentification.Services;
using Myb.Common.Authentification.Interfaces;
using Myb.Common.Authentification.Settings;
using System.Text;
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
            };
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority = "https://www.keycloak.forlink-group.com/realms/MYB";
                    options.Audience = settings.ClientId;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidIssuer = "https://www.keycloak.forlink-group.com/realms/MYB",
                        ValidateIssuer = true,
                        ValidAudience = settings.ClientId,
                        ValidateAudience = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.ClientSecret)),
                        ValidateIssuerSigningKey = true,
                        //ClockSkew = TimeSpan.Zero // enable this line to validate the expiration time below 5mins
                    };
                    options.Events = new JwtBearerEvents()
                    {
                        OnAuthenticationFailed = c =>
                        {
                            c.NoResult();

                            c.Response.StatusCode = 500;
                            c.Response.ContentType = "text/plain";

                            // Debug only for security reasons
                             return c.Response.WriteAsync(c.Exception.ToString());

                            //return c.Response.ToString();
                        }
                    };
                });
             builder.Services.AddAuthorization();

        } 
    }
}