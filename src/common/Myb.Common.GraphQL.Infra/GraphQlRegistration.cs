using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myb.Common.Repositories;
using Myb.Timesheet.Infra;

namespace Myb.Common.GraphQL.Infra
{
    public static class GraphQlRegistration
    {
        public static void RegisterGraphQl<TDbContext, TQuery, TMutation>(this IServiceCollection serviceCollection) 
            where TDbContext : DbContext, new() 
            where TQuery : class 
            where TMutation : class
        {
            serviceCollection.AddScoped<TDbContext>(c =>
            {
                var dbContextFactory = c.GetService<IDbContextFactory<TDbContext>>();
                if(dbContextFactory == null)
                {
                    return new TDbContext();
                }
                return dbContextFactory.CreateDbContext();
            });
            serviceCollection.AddScoped(typeof(IGenericRepository<,,>), typeof(GenericRepository<,,>));

            serviceCollection.AddGraphQLServer()
                .AddAuthorization()
                .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = true)
                .AddSorting()
                .AddFiltering()
                .AddType<TimesheetResolver>()
                //.AddAuthorizationCore()
                .RegisterDbContext<TDbContext>()
                .AddQueryType<TQuery>()
                .AddMutationType<TMutation>()
                .AddTypeExtension<TimesheetResolver>();
        }
    }
}

