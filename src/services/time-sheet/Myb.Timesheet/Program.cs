using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.GraphQL.Infra;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Infra.Extensions;
using Myb.Timesheet.Infra.GraphQl.Mutations;
using Myb.Timesheet.Infra.GraphQl.Querys;

var builder = WebApplication.CreateBuilder(args);


// Add services to the container.
builder.AddKeycloakSettings();
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddServices();

// Configure the HTTP request pipeline.

builder.Services.AddPooledDbContextFactory<TimesheetContext>(options=>options.UseNpgsql(builder.Configuration.GetConnectionString("TimesheetDBConnection")));

builder.Services.RegisterGraphQl<TimesheetContext, TaskQuery, TaskMutation>();
builder.Services.RegisterServices();
builder.AddKeycloakAuthorization();
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapGraphQL();
app.Run();

