using Microsoft.Extensions.DependencyInjection;
using Myb.Timesheet.Infra.GraphQl.Mutations;
using Myb.Timesheet.Infra.GraphQl.Querys;
using Myb.Timesheet.Services;
using QuestPDF.Infrastructure;

namespace Myb.Timesheet.Infra.Extensions
{
    public static class Config
    {
        public static void RegisterServices(this IServiceCollection services)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            services.AddScoped<ITaskService,TaskService>();
            services.AddScoped<IProjectService,ProjectService>();
            services.AddScoped<IEmployeeService,EmployeeService>();
            services.AddScoped<ITimesheetService,TimesheetService>();
            services.AddScoped<ITimeoffService,TimeoffService>();
            services.AddScoped<IPdfService,PdfService>();
        }
    }
}