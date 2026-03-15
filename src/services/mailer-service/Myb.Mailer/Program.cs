using Myb.Mailer.Services;
using Myb.Mailer.Workers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<ISmtpEmailSender, SmtpEmailSender>();
builder.Services.AddHostedService<EmailConsumerWorker>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapHealthChecks("/health");
app.MapGet("/", () => "Myb.Mailer service is running");

app.Run();
