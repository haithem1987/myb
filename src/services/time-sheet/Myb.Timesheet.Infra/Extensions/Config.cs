using Microsoft.Extensions.DependencyInjection;
using Myb.Timesheet.Infra.GraphQl.Mutations;
using Myb.Timesheet.Infra.GraphQl.Querys;
using Myb.Timesheet.Services;
namespace Myb.Timesheet.Infra.Extensions
{
    public static class Config
    {
        public static void RegisterServices(this IServiceCollection services)
        {
            services.AddScoped<ITaskService,TaskService>();
            services.AddScoped<IProjectService,ProjectService>();
            services.AddScoped<IEmployeeService,EmployeeService>();
            services.AddScoped<ITimesheetService,TimesheetService>();
        }
    }
}