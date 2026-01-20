using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Invoice.EntityFrameWork.Infra;
using Myb.Invoice.Infra.GraphQl.Mutations;
using Myb.Invoice.Infra.GraphQl.Querys;
using Myb.Common.GraphQL.Infra;
namespace Myb.Invoice.Configuration;

public static class Configuration
{
    public static void ConfigureInvoiceModule(this WebApplicationBuilder builder)
    {
         builder.Services.AddPooledDbContextFactory<InvoiceContext>(opts =>
        opts.UseNpgsql(builder.Configuration.GetConnectionString("InvoiceDBConnection")));

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
        builder.Services.AddServices();              // your domain services
        builder.Services.RegisterGraphQl<InvoiceContext, InvoiceQuery, InvoiceMutations>("invoice");
    }

    public static void ConfigureInvoiceModuleApp(this WebApplication app)
    {
        app.UseCors("AllowAll");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapGraphQL("/invoice/graphql","invoice");
   
    }
}