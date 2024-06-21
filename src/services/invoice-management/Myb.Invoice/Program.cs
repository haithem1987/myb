using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Invoice.EntityFrameWork.Infra;
using Myb.Invoice.Infra.GraphQl.Mutations;
using Myb.Invoice.Infra.GraphQl.Querys;
using Myb.Common.GraphQL.Infra;
using Myb.Invoice.Infra.Extensions;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowInvoiceOrigins", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.AddKeycloakSettings();
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddServices();


builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddServices();
builder.Services.AddPooledDbContextFactory<InvoiceContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("InvoiceDBConnection")));

builder.Services.RegisterGraphQl<InvoiceContext, InvoiceQuery, InvoiceMutations>();
builder.Services.RegisterServices();


var app = builder.Build();
app.UseCors("AllowInvoiceOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapGraphQL();
app.Run();

