using Microsoft.Extensions.DependencyInjection;
using Myb.Common.Messaging;
using Myb.UserManager.Sevices;


namespace Myb.UserManager.Infra.Extensions
{
    public static class Config
    {
        public static void RegisterServices(this IServiceCollection services)
        {
            services.AddScoped<IUserService,UserService>();
            services.AddEmailPublisher();
        }
    }
}
