using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Myb.Common.Authentification.Extensions;
using Myb.Common.Messaging;
using Myb.Coproperty.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to listen on Railway's PORT and bind to 0.0.0.0
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(int.Parse(port));
});

// Add services to the container.

// Add DbContext
// Prefer container-provided connection string; fall back to DefaultConnection for local dev
var connectionString = builder.Configuration.GetConnectionString("CopropertyDBConnection")
                      ?? builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContextFactory<CopropertyDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add HttpContextAccessor for authentication
builder.Services.AddHttpContextAccessor();

// Validate incoming Keycloak JWTs so resolvers can identify the authenticated caller.
// This populates HttpContext.User when a valid bearer token is present; it does NOT
// reject anonymous/unauthenticated requests by itself (no [Authorize] is applied here),
// so existing callers that don't yet send a token are unaffected.
builder.AddKeycloakAuthorization();
builder.Services.AddTransient<IClaimsTransformation, Myb.Coproperty.Services.KeycloakRoleClaimsTransformation>();

// Add Repositories
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.ICopropertyRepository, Myb.Coproperty.Infrastructure.Repositories.CopropertyRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IUnitRepository, Myb.Coproperty.Infrastructure.Repositories.UnitRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IOwnerRepository, Myb.Coproperty.Infrastructure.Repositories.OwnerRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IOwnerUnitRepository, Myb.Coproperty.Infrastructure.Repositories.OwnerUnitRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.ITenantRepository, Myb.Coproperty.Infrastructure.Repositories.TenantRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IChargeRepository, Myb.Coproperty.Infrastructure.Repositories.ChargeRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IMaintenanceRepository, Myb.Coproperty.Infrastructure.Repositories.MaintenanceRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IInterventionRepository, Myb.Coproperty.Infrastructure.Repositories.InterventionRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.ISignalementRepository, Myb.Coproperty.Infrastructure.Repositories.SignalementRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IInvoiceRepository, Myb.Coproperty.Infrastructure.Repositories.InvoiceRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IAssemblyRepository, Myb.Coproperty.Infrastructure.Repositories.AssemblyRepository>();
// Register ChargeDistribution generic repository
builder.Services.AddScoped<Myb.Common.Repositories.IGenericRepository<Guid, Myb.Coproperty.Models.ChargeDistribution, CopropertyDbContext>, Myb.Common.Repositories.GenericRepository<Guid, Myb.Coproperty.Models.ChargeDistribution, CopropertyDbContext>>();

// Add Services
builder.Services.AddScoped<Myb.Coproperty.Services.ICopropertyService, Myb.Coproperty.Services.CopropertyService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IUnitService, Myb.Coproperty.Services.UnitService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IOwnerService, Myb.Coproperty.Services.OwnerService>();
builder.Services.AddScoped<Myb.Coproperty.Services.ITenantService, Myb.Coproperty.Services.TenantService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IChargeService, Myb.Coproperty.Services.ChargeService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IMaintenanceService, Myb.Coproperty.Services.MaintenanceService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IInterventionService, Myb.Coproperty.Services.InterventionService>();
builder.Services.AddScoped<Myb.Coproperty.Services.ISignalementService, Myb.Coproperty.Services.SignalementService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IFinanceService, Myb.Coproperty.Services.FinanceService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IFundCallService, Myb.Coproperty.Services.FundCallService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IAssemblyService, Myb.Coproperty.Services.AssemblyService>();
builder.Services.AddScoped<Myb.Coproperty.GraphQL.Mutations.IAuthenticationService, Myb.Coproperty.Services.AuthenticationService>();
builder.Services.AddEmailPublisher();

// Monthly fund call payment reminders
builder.Services.AddHostedService<Myb.Coproperty.Services.FundCallReminderService>();

// Keycloak Admin API — used for manager role lookup
builder.Services.Configure<Myb.Coproperty.Services.KeycloakOptions>(
    builder.Configuration.GetSection(Myb.Coproperty.Services.KeycloakOptions.SectionName));
builder.Services.AddHttpClient("keycloak-admin");
builder.Services.AddHttpClient("NotificationService", client =>
{
    var notifUrl = builder.Configuration["Services:NotificationUrl"] ?? "http://myb-notification:8080";
    client.BaseAddress = new Uri(notifUrl);
});
builder.Services.AddScoped<Myb.Coproperty.Services.IKeycloakAdminService, Myb.Coproperty.Services.KeycloakAdminService>();

// Add GraphQL
builder.Services
    .AddGraphQLServer()
    .AddDefaultTransactionScopeHandler()
    .AddQueryType(d => d.Name("Query"))
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.CopropertyQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.UnitQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.OwnerQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.TenantQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.ChargeQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.MaintenanceQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.InvoiceQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.AssemblyQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.FundCallQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.InterventionQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.SignalementQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.DiscussionQueries>()
    .AddMutationType(d => d.Name("Mutation"))
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.CopropertyMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.UnitMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.OwnerMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.TenantMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.ChargeMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.MaintenanceMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.FinanceMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.FundCallMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.AssemblyMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.InterventionMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.SignalementMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.DiscussionMutations>()
    .AddType<Myb.Coproperty.GraphQL.Types.CopropertyType>()
    .AddType<Myb.Coproperty.GraphQL.Types.CopropertyInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.UnitType>()
    .AddType<Myb.Coproperty.GraphQL.Types.UnitInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerUnitType>()
    .AddType<Myb.Coproperty.GraphQL.Types.TenantType>()
    .AddType<Myb.Coproperty.GraphQL.Types.TenantInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerUnitInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.CreateOwnerWithUnitsInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerUnitInputTypeInternal>()
    .AddType<Myb.Coproperty.GraphQL.Types.CurrencyType>()
    .AddType<Myb.Coproperty.GraphQL.Types.ChargeType>()
    .AddType<Myb.Coproperty.GraphQL.Types.ChargeDistributionType>()
    .AddType<Myb.Coproperty.GraphQL.Types.CreateChargeInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.MaintenanceRequestType>()
    .AddType<Myb.Coproperty.GraphQL.Types.MaintenanceRequestInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.InterventionObjectType>()
    .AddType<Myb.Coproperty.GraphQL.Types.InterventionTypeEnumType>()
    .AddType<Myb.Coproperty.GraphQL.Types.SignalementObjectType>()
    .AddType<Myb.Coproperty.GraphQL.Types.CreateSignalementInputType>()
    .AddType<Myb.Coproperty.GraphQL.Types.SignalementTypeEnumType>()
    .AddType<Myb.Coproperty.GraphQL.Types.SignalementZoneEnumType>()
    .AddType<Myb.Coproperty.GraphQL.Types.SignalementStatusEnumType>()
    .AddType<Myb.Coproperty.GraphQL.Types.FundCallType>()
    .AddType<Myb.Coproperty.GraphQL.Types.FundCallPaymentType>()
    .AddType<Myb.Coproperty.GraphQL.Types.DashboardStatsType>()
    .AddType<Myb.Coproperty.GraphQL.Types.TreasuryDataPointType>()
    .AddType<Myb.Coproperty.GraphQL.Types.FinancialReportType>()
    .AddType<Myb.Coproperty.GraphQL.Types.MonthlyBalanceType>()
    .AddType<Myb.Coproperty.GraphQL.Types.InvoiceType>()
    .AddType<Myb.Coproperty.GraphQL.Types.PaymentType>()
    .AddType<Myb.Coproperty.GraphQL.Types.AssemblyType>()
    .AddType<Myb.Coproperty.GraphQL.Types.AssemblyTypeEnumType>()
    .AddType<Myb.Coproperty.GraphQL.Types.AssemblyStatusEnumType>()
    .AddType<Myb.Coproperty.GraphQL.Types.AssemblyAttendanceType>()
    .AddProjections()
    .AddFiltering()
    .AddSorting()
    .AddErrorFilter(error =>
    {
        if (error.Exception is InvalidOperationException or ArgumentException)
            return error.WithMessage(error.Exception.Message).RemoveExtensions();
        // Log unexpected errors with their full details
        if (error.Exception != null)
            Console.Error.WriteLine($"[GraphQL] Unexpected error: {error.Exception}");
        return error;
    })
    .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = true);


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
}

// Migrate database on startup (all environments)
{
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
            app.Logger.LogInformation("Database migration completed successfully.");
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
                await Task.Delay(2000);
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

app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint for Railway
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// GraphQL only - no REST controllers needed
// app.MapControllers();

app.MapGraphQL();
app.MapGraphQL("/coproperty/graphql"); // Support legacy path for backward compatibility

app.Run();
