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

  
    builder.Services.AddServices();              // your domain services
    builder.Services.RegisterGraphQl<InvoiceContext, InvoiceQuery, InvoiceMutations>("invoice");
    }

    public static void ConfigureInvoiceModuleApp(this WebApplication app)
    {
        app.MapGraphQL("/invoice/graphql","invoice");
   
    }
}