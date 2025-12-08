using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.UserManager.EntityFrameWork.Infra;
using Myb.UserManager.Infra.GraphQl.Mutations;
using Myb.UserManager.Infra.GraphQl.Querys;
using Myb.Common.GraphQL.Infra;
using Myb.UserManager.Infra.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddKeycloakSettings();
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddServices();

// Configure the HTTP request pipeline.

builder.Services.AddPooledDbContextFactory<UserContext>(options=>options.UseNpgsql(""));

builder.Services.RegisterGraphQl<UserContext, UserQuery, UserMutation>("usermanager");
builder.Services.RegisterServices();
builder.AddKeycloakAuthorization();


var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapGraphQL();
app.Run();


