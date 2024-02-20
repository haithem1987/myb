using Microsoft.EntityFrameworkCore;
using Myb.UserManager.EntityFrameWork.Infra;
using Myb.UserManager.Infra.GraphQl.Mutations;
using Myb.UserManager.Infra.GraphQl.Querys;
using Myb.Common.GraphQL.Infra;
using Myb.UserManager.Infra.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.


// Configure the HTTP request pipeline.

builder.Services.AddPooledDbContextFactory<UserContext>(options=>options.UseNpgsql(""));
builder.Services.RegisterServices();

builder.Services.RegisterGraphQl<UserContext, UserQuery, UserMutation>();
var app = builder.Build();
app.UseHttpsRedirection();
app.MapGraphQL();
app.Run();


