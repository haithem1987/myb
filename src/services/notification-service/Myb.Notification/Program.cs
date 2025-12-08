using Myb.Notification.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Repositories;
using Myb.Notification;
using Myb.Notification.Configuration;
using Myb.Notification.Models;
using Myb.Notification.Providers;
using Myb.Notification.Services;

var builder = WebApplication.CreateBuilder(args);
builder.ConfigureNotificationModule();
var app = builder.Build();
app.ConfigureNotificationModuleApp();
app.Run();
