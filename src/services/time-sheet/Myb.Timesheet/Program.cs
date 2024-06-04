using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.GraphQL.Infra;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Infra.Extensions;
using Myb.Timesheet.Infra.GraphQl.Mutations;
using Myb.Timesheet.Infra.GraphQl.Querys;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowTimesheetOrigins", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Add services to the container.
builder.AddKeycloakSettings();
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddServices();
builder.Services.RegisterServices();

// Configure the HTTP request pipeline.

builder.Services.AddPooledDbContextFactory<TimesheetContext>(options=>options.UseNpgsql(builder.Configuration.GetConnectionString("TimesheetDBConnection")));

builder.Services.RegisterGraphQl<TimesheetContext, TimesheetQuery, TimesheetMutation>();
builder.AddKeycloakAuthorization();
var app = builder.Build();
app.UseCors("AllowTimesheetOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapGraphQL();
app.Run();

