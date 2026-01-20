using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.GraphQL.Infra;
using Myb.Document.EntityFramework.Infra;
using Myb.Document.Infra.GraphQl.Mutations;
using Myb.Document.Infra.GraphQl.Queries;

namespace Myb.Document.Configuration;

public static class Configuration
{
    
    public static void ConfigureDocumentModule(this WebApplicationBuilder builder)
    {
        builder.Services.AddPooledDbContextFactory<DocumentContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DocumentDBConnection")));

        // Add CORS for GraphQL endpoint
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        builder.AddKeycloakSettings();
        builder.Services.RegisterGraphQl<DocumentContext, DocumentQuery, DocumentMutation>("document");

    }

    public static void ConfigureDocumentModuleApp(this WebApplication app)
    {
        app.UseCors("AllowAll");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapGraphQL("/document/graphql", "document");
        
    }
    
}