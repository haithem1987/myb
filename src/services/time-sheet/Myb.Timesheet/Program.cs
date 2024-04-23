using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.GraphQL.Infra;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.UserManager.EntityFrameWork.Infra;
using Myb.UserManager.Infra.Extensions;
using Myb.UserManager.Infra.GraphQl.Mutations;
using Myb.UserManager.Infra.GraphQl.Querys;

var builder = WebApplication.CreateBuilder(args);


// Add services to the container.
builder.AddKeycloakSettings();
builder.Services.AddHttpClient();
//builder.Services.AddControllers();
//builder.Services.AddServices();

// Configure the HTTP request pipeline.

builder.Services.AddDbContext<TimesheetContext>(options=>options.UseNpgsql(builder.Configuration.GetConnectionString("TimesheetDBConnection")));

//builder.Services.RegisterGraphQl<UserContext, UserQuery, UserMutation>();
builder.Services.RegisterServices();
builder.AddKeycloakAuthorization();
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapGraphQL();
app.Run();

