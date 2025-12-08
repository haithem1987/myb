
using Myb.Document.Configuration;



var builder = WebApplication.CreateBuilder(args);

builder.ConfigureDocumentModule();

var app = builder.Build();
app.ConfigureDocumentModuleApp();
app.Run();

