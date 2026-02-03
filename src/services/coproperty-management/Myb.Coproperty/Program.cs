using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Add DbContext
// Prefer container-provided connection string; fall back to DefaultConnection for local dev
var connectionString = builder.Configuration.GetConnectionString("CopropertyDBConnection")
                      ?? builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContextFactory<CopropertyDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add HttpContextAccessor for authentication
builder.Services.AddHttpContextAccessor();

// Add Repositories
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.ICopropertyRepository, Myb.Coproperty.Infrastructure.Repositories.CopropertyRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IUnitRepository, Myb.Coproperty.Infrastructure.Repositories.UnitRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IOwnerRepository, Myb.Coproperty.Infrastructure.Repositories.OwnerRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IChargeRepository, Myb.Coproperty.Infrastructure.Repositories.ChargeRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IMaintenanceRepository, Myb.Coproperty.Infrastructure.Repositories.MaintenanceRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IInvoiceRepository, Myb.Coproperty.Infrastructure.Repositories.InvoiceRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IAssemblyRepository, Myb.Coproperty.Infrastructure.Repositories.AssemblyRepository>();
// Register ChargeDistribution generic repository
builder.Services.AddScoped<Myb.Common.Repositories.IGenericRepository<Guid, Myb.Coproperty.Models.ChargeDistribution, CopropertyDbContext>, Myb.Common.Repositories.GenericRepository<Guid, Myb.Coproperty.Models.ChargeDistribution, CopropertyDbContext>>();

// Add Services
builder.Services.AddScoped<Myb.Coproperty.Services.ICopropertyService, Myb.Coproperty.Services.CopropertyService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IUnitService, Myb.Coproperty.Services.UnitService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IOwnerService, Myb.Coproperty.Services.OwnerService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IChargeService, Myb.Coproperty.Services.ChargeService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IMaintenanceService, Myb.Coproperty.Services.MaintenanceService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IFinanceService, Myb.Coproperty.Services.FinanceService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IFundCallService, Myb.Coproperty.Services.FundCallService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IAssemblyService, Myb.Coproperty.Services.AssemblyService>();
builder.Services.AddScoped<Myb.Coproperty.GraphQL.Mutations.IAuthenticationService, Myb.Coproperty.Services.AuthenticationService>();

// Add GraphQL
builder.Services
    .AddGraphQLServer()
    .AddDefaultTransactionScopeHandler()
    .AddQueryType(d => d.Name("Query"))
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.CopropertyQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.UnitQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.OwnerQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.ChargeQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.MaintenanceQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.InvoiceQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.AssemblyQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.FundCallQueries>()
    .AddMutationType(d => d.Name("Mutation"))
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.CopropertyMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.UnitMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.OwnerMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.ChargeMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.MaintenanceMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.FinanceMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.FundCallMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.AssemblyMutations>()
    .AddType<Myb.Coproperty.GraphQL.Types.CopropertyType>()
    .AddType<Myb.Coproperty.GraphQL.Types.CopropertyInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.UnitType>()
    .AddType<Myb.Coproperty.GraphQL.Types.UnitInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.ChargeType>()
    .AddType<Myb.Coproperty.GraphQL.Types.ChargeDistributionType>()
    .AddType<Myb.Coproperty.GraphQL.Types.CreateChargeInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.MaintenanceRequestType>()
    .AddType<Myb.Coproperty.GraphQL.Types.MaintenanceRequestInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.DashboardStatsType>()
    .AddType<Myb.Coproperty.GraphQL.Types.TreasuryDataPointType>()
    .AddType<Myb.Coproperty.GraphQL.Types.FinancialReportType>()
    .AddType<Myb.Coproperty.GraphQL.Types.MonthlyBalanceType>()
    .AddType<Myb.Coproperty.GraphQL.Types.InvoiceType>()
    .AddType<Myb.Coproperty.GraphQL.Types.PaymentType>()
    .AddProjections()
    .AddFiltering()
    .AddSorting();


builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
// Swagger disabled for GraphQL-only API
// builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Swagger disabled for GraphQL-only API
    // app.UseSwagger();
    // app.UseSwaggerUI();

    // Migrate database
    using var scope = app.Services.CreateScope();
    var contextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<CopropertyDbContext>>();
    
    int retryCount = 0;
    const int maxRetries = 5;
    
    while (retryCount < maxRetries)
    {
        try
        {
            using var dbContext = contextFactory.CreateDbContext();
            await dbContext.Database.MigrateAsync();
            // Seed data is disabled - create real data via frontend instead
            break;
        }
        catch (Exception ex)
        {
            retryCount++;
            if (retryCount >= maxRetries)
            {
                app.Logger.LogError(ex, "Failed to migrate database after {retries} retries", maxRetries);
            }
            else
            {
                app.Logger.LogWarning(ex, "Failed to migrate database, retrying ({attempt}/{max})...", retryCount, maxRetries);
                await Task.Delay(2000); // Wait 2 seconds before retry
            }
        }
    }
}

// Only redirect to HTTPS when configured (avoid warning in containers)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowAll");

app.UseAuthorization();

// GraphQL only - no REST controllers needed
// app.MapControllers();

app.MapGraphQL();
app.MapGraphQL("/coproperty/graphql"); // Support legacy path for backward compatibility

app.Run();
