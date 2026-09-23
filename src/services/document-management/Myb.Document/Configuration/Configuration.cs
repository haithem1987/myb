using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.Authentification.Security;
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

        builder.AddKeycloakSettings();
        builder.AddKeycloakAuthorization();
        builder.AddMybApiSecurity();
        builder.Services.RegisterGraphQl<DocumentContext, DocumentQuery, DocumentMutation>("document");

    }

    public static void ConfigureDocumentModuleApp(this WebApplication app)
    {
        app.UseMybApiSecurity();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapGraphQL("/document/graphql", "document");
        
    }
    
}
