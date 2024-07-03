using Microsoft.Extensions.DependencyInjection;
using Myb.Invoice.Services;
namespace Myb.Invoice.Infra.Extensions
{
    public static class Config
    {
        public static void RegisterServices(this IServiceCollection services)
        {
            services.AddScoped<IInvoiceService, InvoiceService>();
            services.AddScoped<IContactService, ContactService>();
            services.AddScoped<IClientService, ClientService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IProductLineService, ProductLineService>();

        }
    }
}
