
using Myb.Invoice.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureInvoiceModule();

var app = builder.Build();
app.ConfigureInvoiceModuleApp();
app.Run();

