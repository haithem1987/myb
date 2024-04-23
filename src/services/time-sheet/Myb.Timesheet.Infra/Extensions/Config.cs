using Microsoft.Extensions.DependencyInjection;
using Myb.Timesheet.Services;
namespace Myb.Timesheet.Infra.Extensions
{
    public static class Config
    {
        public static void RegisterServices(this IServiceCollection services)
        {
            services.AddScoped<ITaskService,TaskService>();
        }
    }
}