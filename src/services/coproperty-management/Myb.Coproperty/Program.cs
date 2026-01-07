using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Add DbContext
builder.Services.AddDbContext<CopropertyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Repositories
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.ICopropertyRepository, Myb.Coproperty.Infrastructure.Repositories.CopropertyRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IUnitRepository, Myb.Coproperty.Infrastructure.Repositories.UnitRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IOwnerRepository, Myb.Coproperty.Infrastructure.Repositories.OwnerRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IChargeRepository, Myb.Coproperty.Infrastructure.Repositories.ChargeRepository>();
builder.Services.AddScoped<Myb.Coproperty.Infrastructure.Repositories.IMaintenanceRepository, Myb.Coproperty.Infrastructure.Repositories.MaintenanceRepository>();

// Add Services
builder.Services.AddScoped<Myb.Coproperty.Services.ICopropertyService, Myb.Coproperty.Services.CopropertyService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IUnitService, Myb.Coproperty.Services.UnitService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IOwnerService, Myb.Coproperty.Services.OwnerService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IChargeService, Myb.Coproperty.Services.ChargeService>();
builder.Services.AddScoped<Myb.Coproperty.Services.IMaintenanceService, Myb.Coproperty.Services.MaintenanceService>();

// Add GraphQL
builder.Services
    .AddGraphQLServer()
    .AddQueryType(d => d.Name("Query"))
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.CopropertyQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.UnitQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.OwnerQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.ChargeQueries>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Queries.MaintenanceQueries>()
    .AddMutationType(d => d.Name("Mutation"))
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.CopropertyMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.UnitMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.OwnerMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.ChargeMutations>()
        .AddTypeExtension<Myb.Coproperty.GraphQL.Mutations.MaintenanceMutations>()
    .AddType<Myb.Coproperty.GraphQL.Types.CopropertyType>()
    .AddType<Myb.Coproperty.GraphQL.Types.UnitType>()
    .AddType<Myb.Coproperty.GraphQL.Types.OwnerType>()
    .AddType<Myb.Coproperty.GraphQL.Types.ChargeType>()
    .AddType<Myb.Coproperty.GraphQL.Types.MaintenanceRequestType>()
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
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.MapGraphQL();

app.Run();
