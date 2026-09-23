using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.Authentification.Security;
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

        builder.AddKeycloakAuthorization();
        builder.AddMybApiSecurity();
        builder.Services.RegisterGraphQl<TimesheetContext, TimesheetQuery, TimesheetMutation>("timesheet");
    }

    public static void ConfigureTimesheetModuleApp(this WebApplication app)
    {
        app.UseMybApiSecurity();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapGraphQL("/timesheet/graphql", "timesheet");
    }
}
