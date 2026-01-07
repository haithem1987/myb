# GitHub Copilot Instructions for MYB Project

## Project Context

You are working on **MYB (Manage Your Business)**, a comprehensive SaaS platform combining ERP and CRM functionalities for SMEs. The platform uses a microservices architecture with:

- **Frontend**: Angular 17 (migrating to 21) with Nx monorepo
- **Backend**: ASP.NET Core 7.0 (migrating to .NET 10) microservices
- **Database**: PostgreSQL (separate DB per service)
- **Auth**: Keycloak with OAuth2/JWT
- **GraphQL**: HotChocolate for API layer
- **DevOps**: Docker Compose orchestration

---

## Architecture Guidelines

### Microservices Structure

Each service follows this pattern:
```
Service.Name/
├── Controllers/       # API endpoints
├── Services/          # Business logic
├── Models/           # Domain entities
├── Infrastructure/   # Data access, repositories
└── GraphQL/          # Queries, mutations, types
```

**When suggesting code:**
- Follow the existing service structure
- Keep services independent (no direct inter-service dependencies)
- Use repository pattern for data access
- Implement GraphQL schemas for all operations

### Frontend Structure (Nx Monorepo)

```
myb.front/
├── apps/
│   ├── admin/        # Admin application
│   └── client/       # Client application
└── libs/
    ├── auth/         # Authentication module
    ├── shared/       # Shared components/utilities
    ├── document-module/
    ├── invoice-module/
    └── timesheet-module/
```

**When suggesting code:**
- Use Nx library structure for shared code
- Follow Angular standalone components pattern (Angular 17+)
- Use signals for state management where appropriate
- Implement lazy loading for feature modules

---

## Coding Standards

### Backend (.NET/C#)

**Naming Conventions:**
```csharp
// Classes: PascalCase
public class InvoiceService { }

// Methods: PascalCase
public async Task<Invoice> CreateInvoiceAsync() { }

// Variables: camelCase
var invoiceTotal = 0;

// Private fields: _camelCase
private readonly IInvoiceRepository _invoiceRepository;

// Constants: UPPER_SNAKE_CASE or PascalCase
public const int MAX_INVOICE_ITEMS = 100;
```

**Async/Await Pattern:**
```csharp
// Always use async suffix and return Task<T>
public async Task<List<Invoice>> GetInvoicesAsync()
{
    return await _context.Invoices
        .Where(i => i.IsActive)
        .ToListAsync();
}
```

**Dependency Injection:**
```csharp
// Constructor injection (preferred)
public class InvoiceService
{
    private readonly IInvoiceRepository _repository;
    private readonly ILogger<InvoiceService> _logger;
    
    public InvoiceService(
        IInvoiceRepository repository,
        ILogger<InvoiceService> logger)
    {
        _repository = repository;
        _logger = logger;
    }
}
```

**Error Handling:**
```csharp
// Use try-catch with specific exceptions
try
{
    return await _repository.CreateAsync(invoice);
}
catch (DbUpdateException ex)
{
    _logger.LogError(ex, "Failed to create invoice");
    throw new InvoiceCreationException("Could not create invoice", ex);
}
```

### Frontend (TypeScript/Angular)

**Naming Conventions:**
```typescript
// Interfaces: PascalCase with 'I' prefix
interface IInvoice { }

// Classes: PascalCase
class InvoiceService { }

// Methods/Functions: camelCase
async getInvoices(): Promise<Invoice[]> { }

// Variables: camelCase
const invoiceTotal = 0;

// Constants: UPPER_SNAKE_CASE
const MAX_INVOICE_ITEMS = 100;

// Components: kebab-case files, PascalCase classes
// invoice-list.component.ts
export class InvoiceListComponent { }
```

**Observable Pattern:**
```typescript
// Use RxJS operators properly
getInvoices(): Observable<Invoice[]> {
  return this.apollo.query<InvoicesResponse>({
    query: GET_INVOICES_QUERY
  }).pipe(
    map(result => result.data.invoices),
    catchError(error => {
      console.error('Failed to fetch invoices', error);
      return of([]);
    })
  );
}
```

**Angular Signals (Angular 17+):**
```typescript
// Use signals for reactive state
export class InvoiceComponent {
  invoices = signal<Invoice[]>([]);
  selectedInvoice = signal<Invoice | null>(null);
  
  // Computed signals
  totalAmount = computed(() => 
    this.invoices().reduce((sum, inv) => sum + inv.total, 0)
  );
}
```

---

## Common Patterns

### GraphQL Implementation

**Backend (HotChocolate):**
```csharp
// Query
[ExtendObjectType("Query")]
public class InvoiceQueries
{
    public async Task<List<Invoice>> GetInvoices(
        [Service] IInvoiceRepository repository)
    {
        return await repository.GetAllAsync();
    }
}

// Mutation
[ExtendObjectType("Mutation")]
public class InvoiceMutations
{
    public async Task<Invoice> CreateInvoice(
        CreateInvoiceInput input,
        [Service] IInvoiceService service)
    {
        return await service.CreateAsync(input);
    }
}
```

**Frontend (Apollo Angular):**
```typescript
// Query
const GET_INVOICES = gql`
  query GetInvoices {
    invoices {
      id
      invoiceNumber
      total
      status
    }
  }
`;

// Usage
this.apollo.watchQuery<InvoicesResponse>({
  query: GET_INVOICES
}).valueChanges.subscribe(result => {
  this.invoices.set(result.data.invoices);
});
```

### Entity Framework Patterns

**Repository Pattern:**
```csharp
public interface IInvoiceRepository
{
    Task<Invoice?> GetByIdAsync(Guid id);
    Task<List<Invoice>> GetAllAsync();
    Task<Invoice> CreateAsync(Invoice invoice);
    Task UpdateAsync(Invoice invoice);
    Task DeleteAsync(Guid id);
}

public class InvoiceRepository : IInvoiceRepository
{
    private readonly ApplicationDbContext _context;
    
    public async Task<Invoice?> GetByIdAsync(Guid id)
    {
        return await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.InvoiceDetails)
            .FirstOrDefaultAsync(i => i.Id == id);
    }
}
```

### Authentication & Authorization

**Backend:**
```csharp
// Controller with authorization
[Authorize(Roles = "MYB_ADMIN,MYB_MANAGER")]
[ApiController]
[Route("api/[controller]")]
public class InvoiceController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Invoice>>> GetInvoices()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        // Implementation
    }
}
```

**Frontend:**
```typescript
// Auth guard
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.authService.login();
    return false;
  }
}
```

---

## Database Guidelines

### Migration Strategy

```bash
# Create migration
dotnet ef migrations add MigrationName --project ServiceName

# Apply migration
dotnet ef database update --project ServiceName
```

### Entity Configuration

```csharp
public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.HasKey(i => i.Id);
        
        builder.Property(i => i.InvoiceNumber)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.Property(i => i.Total)
            .HasPrecision(18, 2);
            
        builder.HasOne(i => i.Client)
            .WithMany(c => c.Invoices)
            .HasForeignKey(i => i.ClientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

---

## Testing Patterns

### Backend Unit Tests

```csharp
public class InvoiceServiceTests
{
    private readonly Mock<IInvoiceRepository> _mockRepository;
    private readonly InvoiceService _service;
    
    public InvoiceServiceTests()
    {
        _mockRepository = new Mock<IInvoiceRepository>();
        _service = new InvoiceService(_mockRepository.Object);
    }
    
    [Fact]
    public async Task CreateInvoice_ValidInput_ReturnsInvoice()
    {
        // Arrange
        var input = new CreateInvoiceInput { /* ... */ };
        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<Invoice>()))
            .ReturnsAsync(new Invoice());
        
        // Act
        var result = await _service.CreateAsync(input);
        
        // Assert
        Assert.NotNull(result);
    }
}
```

### Frontend Unit Tests

```typescript
describe('InvoiceListComponent', () => {
  let component: InvoiceListComponent;
  let fixture: ComponentFixture<InvoiceListComponent>;
  let mockService: jasmine.SpyObj<InvoiceService>;
  
  beforeEach(() => {
    mockService = jasmine.createSpyObj('InvoiceService', ['getInvoices']);
    
    TestBed.configureTestingModule({
      imports: [InvoiceListComponent],
      providers: [
        { provide: InvoiceService, useValue: mockService }
      ]
    });
    
    fixture = TestBed.createComponent(InvoiceListComponent);
    component = fixture.componentInstance;
  });
  
  it('should load invoices on init', () => {
    mockService.getInvoices.and.returnValue(of([
      { id: '1', total: 100 }
    ]));
    
    component.ngOnInit();
    
    expect(component.invoices().length).toBe(1);
  });
});
```

---

## Docker & DevOps

### Dockerfile Pattern

```dockerfile
# Backend service
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["ServiceName/ServiceName.csproj", "ServiceName/"]
RUN dotnet restore "ServiceName/ServiceName.csproj"
COPY . .
WORKDIR "/src/ServiceName"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ServiceName.dll"]
```

### Docker Compose Service Pattern

```yaml
service-name:
  build:
    context: ./src/services/service-name
    dockerfile: Dockerfile
  ports:
    - "5001:80"
  environment:
    - ASPNETCORE_ENVIRONMENT=Development
    - ConnectionStrings__DefaultConnection=Host=postgres;Database=servicedb;Username=postgres;Password=password
  depends_on:
    - postgres
    - keycloak
  networks:
    - myb-network
```

---

## Git Workflow

### Branch Naming

```
feature/invoice-pdf-export
bugfix/timesheet-calculation
hotfix/login-error
release/1.2.0
```

### Commit Messages

```
feat: add invoice PDF export functionality
fix: resolve timesheet calculation error
docs: update API documentation
refactor: simplify invoice service logic
test: add unit tests for payment service
chore: update dependencies to .NET 10
```

---

## Common Pitfalls to Avoid

### Backend

❌ **Don't:**
```csharp
// Blocking calls
var result = _repository.GetByIdAsync(id).Result;

// Exposing entities directly
[HttpGet]
public List<Invoice> GetInvoices() => _context.Invoices.ToList();

// Missing error handling
public async Task DeleteInvoice(Guid id)
{
    await _repository.DeleteAsync(id);
}
```

✅ **Do:**
```csharp
// Proper async/await
var result = await _repository.GetByIdAsync(id);

// Use DTOs
[HttpGet]
public async Task<ActionResult<List<InvoiceDto>>> GetInvoices()
{
    var invoices = await _service.GetAllAsync();
    return Ok(_mapper.Map<List<InvoiceDto>>(invoices));
}

// Proper error handling
public async Task<Result> DeleteInvoice(Guid id)
{
    try
    {
        await _repository.DeleteAsync(id);
        return Result.Success();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to delete invoice {Id}", id);
        return Result.Failure("Could not delete invoice");
    }
}
```

### Frontend

❌ **Don't:**
```typescript
// Subscribing without unsubscribing
ngOnInit() {
  this.service.getInvoices().subscribe(data => {
    this.invoices = data;
  });
}

// Direct DOM manipulation
document.getElementById('invoice').style.display = 'none';
```

✅ **Do:**
```typescript
// Using async pipe or proper cleanup
invoices$ = this.service.getInvoices();

// Or with signals
invoices = signal<Invoice[]>([]);

ngOnInit() {
  this.service.getInvoices().subscribe(data => {
    this.invoices.set(data);
  });
}

// Angular directives
<div *ngIf="showInvoice" #invoiceRef>
```

---

## When Generating Code

### Checklist

- [ ] Follow existing project structure
- [ ] Use appropriate naming conventions
- [ ] Include error handling
- [ ] Add XML documentation comments (C#)
- [ ] Add JSDoc comments (TypeScript)
- [ ] Use dependency injection
- [ ] Follow async/await patterns
- [ ] Include unit tests when appropriate
- [ ] Consider security (authorization, validation)
- [ ] Use DTOs for API responses
- [ ] Implement proper logging

### Context-Specific Guidelines

**For Backend Services:**
1. Check which service you're modifying (User, Document, Invoice, Timesheet)
2. Use the service's DbContext and existing repositories
3. Follow the service's GraphQL schema conventions
4. Ensure proper authentication/authorization attributes

**For Frontend Features:**
1. Determine if code belongs in apps/ or libs/
2. Use the appropriate feature module (document-module, invoice-module, etc.)
3. Follow the established GraphQL query patterns
4. Use shared components from libs/shared when possible

**For Database Changes:**
1. Always create migrations for schema changes
2. Use proper column types and constraints
3. Consider existing data when modifying tables
4. Update seed data if necessary

---

## Quick Reference

### Service Ports

- Frontend: 4200
- Keycloak: 8080
- User Manager: 5001
- Document Service: 5002
- Invoice Service: 5003
- Timesheet Service: 5004
- Payment Service: 5005
- Notification Service: 5006

### Database Ports

- Timesheet DB: 5448
- Document DB: 5433
- Invoice DB: 5434
- User DB: 5432

### Important Files

- Master deployment script: `./myb.sh`
- Docker orchestration: `docker-compose.yml`
- Frontend workspace: `src/front/myb.front/nx.json`
- Backend solution: `Myb.sln`

---

## Additional Context

**Current State:**
- .NET 7.0 (migrating to .NET 10)
- Angular 17 (migrating to Angular 21)
- PostgreSQL 16.2
- Keycloak 22

**Key Technologies:**
- HotChocolate GraphQL
- Apollo Angular
- Entity Framework Core
- SignalR (notifications)
- Stripe (payments)

**Development Tools:**
- Nx CLI for frontend
- dotnet CLI for backend
- Docker Desktop for containers
- Visual Studio / VS Code

---

## Final Notes

When suggesting code:
1. **Always match the existing coding style** in the file being edited
2. **Consider the broader context** of the microservice architecture
3. **Prioritize maintainability** over clever solutions
4. **Include comments** for complex business logic
5. **Suggest tests** when implementing new features
6. **Consider performance** implications of queries and operations
7. **Always when creating md files, save them inside docs/ folder of the root**

**For Questions:** Refer to README.md sections for detailed architecture and setup inform