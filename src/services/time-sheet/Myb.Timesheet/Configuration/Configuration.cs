using Microsoft.EntityFrameworkCore;
using Myb.Common.GraphQL.Infra;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Infra.GraphQl.Mutations;
using Myb.Timesheet.Infra.GraphQl.Querys;

namespace Myb.Timesheet.Configuration;

public static class Configuration
{
    public static void ConfigureTimesheetModule(this WebApplicationBuilder builder)
    {
        builder.Services.AddPooledDbContextFactory<TimesheetContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("TimesheetDBConnection")));

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

        builder.Services.RegisterGraphQl<TimesheetContext, TimesheetQuery, TimesheetMutation>("timesheet");
    }

    public static void ConfigureTimesheetModuleApp(this WebApplication app)
    {
        app.UseCors("AllowAll");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapGraphQL("/timesheet/graphql", "timesheet");
    }
}