using Npgsql;

// 1) Connection to the default “postgres” database
const string adminConn = 
    "Host=localhost;Port=5432;Username=root;Password=user-pwd;Database=postgres";
await using var adminDataSource = NpgsqlDataSource.Create(adminConn);

// 2) Check for—and create if missing—the `keycloak` database
await using (var cmd = adminDataSource.CreateCommand(@"
    SELECT 1 FROM pg_database WHERE datname = 'keycloak';
"))
{
    var exists = (await cmd.ExecuteScalarAsync()) != null;
    if (!exists)
    {
        await using var create = adminDataSource.CreateCommand(
            "CREATE DATABASE keycloak;"
        );
        await create.ExecuteNonQueryAsync();
        Console.WriteLine("➡️ Created 'keycloak' database.");
    }
}

// 3) (Optional) You can also create the user if needed:
await using (var cmd = adminDataSource.CreateCommand(@"
    SELECT 1 FROM pg_roles WHERE rolname = 'kc_user';
"))
{
    var userExists = (await cmd.ExecuteScalarAsync()) != null;
    if (!userExists)
    {
        await using var createUser = adminDataSource.CreateCommand(@"
            CREATE USER kc_user WITH PASSWORD 'kc_pwd';
            GRANT ALL PRIVILEGES ON DATABASE keycloak TO kc_user;
        ");
        await createUser.ExecuteNonQueryAsync();
        Console.WriteLine("➡️ Created 'kc_user' role and granted privileges.");
    }
}

var builder = DistributedApplication.CreateBuilder(args);


var keycloak = builder
    .AddContainer("keycloak", "docker.io/bitnami/keycloak:22.0.3")
    .WithHttpEndpoint(8080, 8080)
    // Bitnami’s _only_ supported DB env vars:
    .WithEnvironment("KEYCLOAK_DATABASE_HOST",     "host.docker.internal")
    .WithEnvironment("KEYCLOAK_DATABASE_PORT",     "5432")
    .WithEnvironment("KEYCLOAK_DATABASE_NAME",     "keycloak")
    .WithEnvironment("KEYCLOAK_DATABASE_USER",     "kc_user")
    .WithEnvironment("KEYCLOAK_DATABASE_PASSWORD", "kc_pwd")
    .WithEnvironment("KEYCLOAK_ADMIN",          "admin")
    .WithEnvironment("KEYCLOAK_ADMIN_PASSWORD", "admin");

var timesheetDb = builder.AddConnectionString("TimesheetDBConnection", 
    "TimesheetDBConnection");

var documentDb = builder.AddConnectionString("DocumentDBConnection", 
    "Host=localhost;Port=5432;Database=documentDB;Username=root;Password=document_pwd");

var invoiceDb = builder.AddConnectionString("InvoiceDBConnection", 
    "Host=localhost;Port=5432;Database=invoiceDB;Username=root;Password=invoice_pwd");


/*builder.AddContainer("timesheet", "myb-timesheet:latest")
    .WithContainerName("myb-timesheet")
    .WithImageTag("latest")
    .WithReference(keycloak)
    .WithEnvironment("ConnectionStrings__TimesheetDBConnection", "...");

builder.AddContainer("document", "myb-docmanager:latest")
    .WithContainerName("myb-docmanager")
    .WithImageTag("latest")
    .WithReference(keycloak);

builder.AddContainer("invoice", "myb-invoice:latest")
    .WithContainerName("myb-invoice")
    .WithImageTag("latest")
    .WithReference(keycloak);*/

builder.AddProject<Projects.Myb_Payment>("payment-service")
    
    .WithReference(keycloak.GetEndpoint("http"));

builder.AddProject<Projects.Myb_Timesheet>("timesheet-service")
    .WithReference(keycloak.GetEndpoint("http"))
    .WithReference(timesheetDb);

builder.AddProject<Projects.Myb_Document>("document-service")
    .WithReference(keycloak.GetEndpoint("http"))
    .WithReference(documentDb);

builder.AddProject<Projects.Myb_Invoice>("invoice-service")
    .WithReference(keycloak.GetEndpoint("http"))
    .WithReference(invoiceDb);

builder.AddProject<Projects.Myb_Notification>("notification-service");
/*builder.AddContainer("myb-front", "myb.front:latest")
    .WithEndpoint( 4200,  4200,  "http") // 🔧 specify TargetPort
    .WithReference(keycloak)
    .WithEnvironment("NODE_ENV", "development");*/
builder.AddExecutable("frontend", "./start-clientApp.sh", "../../front/myb.front",      new[] { "--host", "0.0.0.0", "--port", "4200" })
    .WithHttpEndpoint(4200,  4200, "http",  null,false);


builder.Build().Run();