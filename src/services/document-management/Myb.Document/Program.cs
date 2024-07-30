using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.GraphQL.Infra;
using Myb.Document.EntityFramework.Infra;

using Myb.Document.Infra.GraphQl.Mutations;
using Myb.Document.Infra.GraphQl.Queries;
using Myb.Document.Infra.GraqhQl.Extensions;




var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowDocumentOrigins", policy =>
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




builder.Services.AddPooledDbContextFactory<DocumentContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DocumentDBConnection")));

builder.Services.RegisterGraphQl<DocumentContext, DocumentQuery, DocumentMutation>();

builder.Services.RegisterServices();
builder.AddKeycloakAuthorization();

var app = builder.Build();



app.UseCors("AllowDocumentOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapGraphQL();
app.Run();

