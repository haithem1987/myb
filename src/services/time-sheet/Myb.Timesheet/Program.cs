
using Myb.Timesheet.Configuration;

var builder = WebApplication.CreateBuilder(args);
builder.ConfigureTimesheetModule();

var app = builder.Build();
app.ConfigureTimesheetModuleApp();
app.Run();

