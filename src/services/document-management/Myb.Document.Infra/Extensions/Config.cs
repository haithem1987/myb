using Microsoft.Extensions.DependencyInjection;
using Myb.Document.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Document.Infra.GraqhQl.Extensions
{
    public static class Config
    {
        public static void RegisterServices(this IServiceCollection services)
        {
            services.AddScoped<IDocumentService, DocumentService>();
            services.AddScoped<IFolderService, FolderService>();
            services.AddScoped<IRootFolderService, RootFolderService>();
        }



    }
}
