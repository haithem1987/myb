using Xunit;
using Moq;
using Myb.Coproperty.Services;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace CopropertyManagement.Tests.Services;

/// <summary>
/// Unit tests for FinanceService
/// </summary>
public class FinanceServiceTests
{
    private readonly CopropertyDbContext _dbContext;
    private readonly Mock<IChargeRepository> _mockChargeRepository;
    private readonly Mock<ICopropertyRepository> _mockCopropertyRepository;
    private readonly Mock<IUnitRepository> _mockUnitRepository;
    private readonly Mock<IOwnerRepository> _mockOwnerRepository;
    private readonly FinanceService _financeService;

    public FinanceServiceTests()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<CopropertyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new CopropertyDbContext(options);

        // Setup mocks
        _mockChargeRepository = new Mock<IChargeRepository>();
        _mockCopropertyRepository = new Mock<ICopropertyRepository>();
        _mockUnitRepository = new Mock<IUnitRepository>();
        _mockOwnerRepository = new Mock<IOwnerRepository>();

        // Create service instance
        _financeService = new FinanceService(
            _dbContext,
            _mockChargeRepository.Object,
            _mockCopropertyRepository.Object,
            _mockUnitRepository.Object,
            _mockOwnerRepository.Object
        );
    }

    #region GetDashboardStatsAsync Tests

    [Fact]
    public async Task GetDashboardStatsAsync_WithoutFilter_ReturnsAggregatedStats()
    {
        // Arrange
        var coproperty = CreateSampleCoproperty();
        var units = CreateSampleUnits(coproperty.Id, 5);
        var charges = CreateSampleCharges(coproperty.Id, 2);
        var invoices = CreateSampleInvoices(charges[0].Id, units, 5);

        _dbContext.Coproperties.Add(coproperty);
        _dbContext.Units.AddRange(units);
        _dbContext.Charges.AddRange(charges);
        _dbContext.CopropertyInvoices.AddRange(invoices);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _financeService.GetDashboardStatsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCoproperties);
        Assert.Equal(5, result.TotalUnits);
        Assert.True(result.TotalCharges > 0);
        Assert.Equal(0, result.OverdueInvoices); // None are overdue yet
    }

    [Fact]
    public async Task GetDashboardStatsAsync_WithCopropertyFilter_ReturnsCopropertyStats()
    {
        // Arrange
        var coproperty1 = CreateSampleCoproperty();
        var coproperty2 = CreateSampleCoproperty();
        var units1 = CreateSampleUnits(coproperty1.Id, 3);
        var units2 = CreateSampleUnits(coproperty2.Id, 2);

        _dbContext.Coproperties.AddRange(coproperty1, coproperty2);
        _dbContext.Units.AddRange(units1);
        _dbContext.Units.AddRange(units2);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _financeService.GetDashboardStatsAsync(coproperty1.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalUnits); // Only units from coproperty1
    }

    [Fact]
    public async Task GetDashboardStatsAsync_WithOverdueInvoices_CountsOverdue()
    {
        // Arrange
        var coproperty = CreateSampleCoproperty();
        var units = CreateSampleUnits(coproperty.Id, 3);
        var charge = CreateSampleCharge(coproperty.Id);

        _dbContext.Coproperties.Add(coproperty);
        _dbContext.Units.AddRange(units);
        _dbContext.Charges.Add(charge);
        await _dbContext.SaveChangesAsync();

        // Create overdue invoice
        var overdueInvoice = new CopropertyInvoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = "INV-001",
            ChargeId = charge.Id,
            UnitId = units[0].Id,
            Amount = 1000,
            TotalAmount = 1000,
            InvoiceDate = DateTime.UtcNow.AddMonths(-2),
            DueDate = DateTime.UtcNow.AddMonths(-1),
            Status = InvoiceStatus.Pending,
            CreatedBy = "test",
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CopropertyInvoices.Add(overdueInvoice);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _financeService.GetDashboardStatsAsync(coproperty.Id);

        // Assert
        Assert.Equal(1, result.OverdueInvoices);
    }

    #endregion

    #region GetTreasuryEvolutionAsync Tests

    [Fact]
    public async Task GetTreasuryEvolutionAsync_Returns12Months()
    {
        // Arrange
        var coproperty = CreateSampleCoproperty();
        var units = CreateSampleUnits(coproperty.Id, 1);
        var charge = CreateSampleCharge(coproperty.Id);

        _dbContext.Coproperties.Add(coproperty);
        _dbContext.Units.AddRange(units);
        _dbContext.Charges.Add(charge);
        await _dbContext.SaveChangesAsync();

        // Create invoices and payments for different months
        for (int i = 0; i < 12; i++)
        {
            var paymentDate = DateTime.UtcNow.AddMonths(-11 + i);
            var invoice = new CopropertyInvoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = $"INV-{i:D3}",
                ChargeId = charge.Id,
                UnitId = units[0].Id,
                Amount = 500,
                TotalAmount = 500,
                InvoiceDate = paymentDate,
                DueDate = paymentDate.AddDays(30),
                Status = InvoiceStatus.Paid,
                PaidDate = paymentDate.AddDays(5),
                CreatedBy = "test",
                CreatedAt = DateTime.UtcNow
            };

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                Amount = 500,
                PaymentDate = paymentDate.AddDays(5),
                PaymentMethod = "Bank Transfer",
                CreatedBy = "test",
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.CopropertyInvoices.Add(invoice);
            _dbContext.Payments.Add(payment);
        }
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _financeService.GetTreasuryEvolutionAsync(coproperty.Id, 12);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(12, result.Count);
        Assert.All(result, point =>
        {
            Assert.NotEmpty(point.Month);
            Assert.True(point.Amount >= 0);
        });
    }

    #endregion

    #region GenerateInvoicesFromChargeAsync Tests

    [Fact]
    public async Task GenerateInvoicesFromChargeAsync_CreatesInvoicePerDistribution()
    {
        // Arrange
        var charge = CreateSampleCharge(Guid.NewGuid());
        var distributions = new List<ChargeDistribution>
        {
            new() { Id = Guid.NewGuid(), ChargeId = charge.Id, UnitId = Guid.NewGuid(), Percentage = 50 },
            new() { Id = Guid.NewGuid(), ChargeId = charge.Id, UnitId = Guid.NewGuid(), Percentage = 50 }
        };

        _dbContext.Charges.Add(charge);
        _dbContext.ChargeDistributions.AddRange(distributions);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _financeService.GenerateInvoicesFromChargeAsync(charge.Id, "testuser");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, invoice =>
        {
            Assert.Equal(InvoiceStatus.Pending, invoice.Status);
            Assert.True(invoice.TotalAmount > 0);
        });
    }

    [Fact]
    public async Task GenerateInvoicesFromChargeAsync_CalculatesAmountCorrectly()
    {
        // Arrange
        var charge = new Charge
        {
            Id = Guid.NewGuid(),
            CopropertyId = Guid.NewGuid(),
            Name = "Test Charge",
            Amount = 1000,
            CreatedAt = DateTime.UtcNow
        };

        var distribution = new ChargeDistribution
        {
            Id = Guid.NewGuid(),
            ChargeId = charge.Id,
            UnitId = Guid.NewGuid(),
            Percentage = 30 // 30% of 1000 = 300
        };

        _dbContext.Charges.Add(charge);
        _dbContext.ChargeDistributions.Add(distribution);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _financeService.GenerateInvoicesFromChargeAsync(charge.Id, "testuser");

        // Assert
        var invoice = result.Single();
        var expectedAmount = (charge.Amount * distribution.Percentage) / 100;
        Assert.Equal(expectedAmount, invoice.Amount);
    }

    [Fact]
    public async Task GenerateInvoicesFromChargeAsync_ThrowsWhenChargeNotFound()
    {
        // Arrange
        var chargeId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _financeService.GenerateInvoicesFromChargeAsync(chargeId, "testuser"));
    }

    #endregion

    #region RecordPaymentAsync Tests

    [Fact]
    public async Task RecordPaymentAsync_CreatesPaymentRecord()
    {
        // Arrange
        var invoice = CreateSampleInvoice();
        _dbContext.CopropertyInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        var paymentInput = new RecordPaymentInput
        {
            InvoiceId = invoice.Id,
            Amount = 500,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Bank Transfer",
            Reference = "TXN-12345"
        };

        // Act
        var result = await _financeService.RecordPaymentAsync(paymentInput, "testuser");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(paymentInput.Amount, result.Amount);
        Assert.Equal(paymentInput.PaymentMethod, result.PaymentMethod);
    }

    [Fact]
    public async Task RecordPaymentAsync_UpdatesInvoiceStatusToPartiallyPaid()
    {
        // Arrange
        var invoice = CreateSampleInvoice();
        _dbContext.CopropertyInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        var paymentInput = new RecordPaymentInput
        {
            InvoiceId = invoice.Id,
            Amount = invoice.TotalAmount / 2, // Pay half
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Bank Transfer"
        };

        // Act
        await _financeService.RecordPaymentAsync(paymentInput, "testuser");

        // Assert
        var updated = await _dbContext.CopropertyInvoices.FindAsync(invoice.Id);
        Assert.Equal(InvoiceStatus.PartiallyPaid, updated?.Status);
    }

    [Fact]
    public async Task RecordPaymentAsync_UpdatesInvoiceStatusToPaid()
    {
        // Arrange
        var invoice = CreateSampleInvoice();
        _dbContext.CopropertyInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        var paymentInput = new RecordPaymentInput
        {
            InvoiceId = invoice.Id,
            Amount = invoice.TotalAmount, // Pay full amount
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Bank Transfer"
        };

        // Act
        await _financeService.RecordPaymentAsync(paymentInput, "testuser");

        // Assert
        var updated = await _dbContext.CopropertyInvoices.FindAsync(invoice.Id);
        Assert.Equal(InvoiceStatus.Paid, updated?.Status);
        Assert.NotNull(updated?.PaidDate);
    }

    [Fact]
    public async Task RecordPaymentAsync_ThrowsWhenInvoiceNotFound()
    {
        // Arrange
        var paymentInput = new RecordPaymentInput
        {
            InvoiceId = Guid.NewGuid(),
            Amount = 100,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Bank Transfer"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _financeService.RecordPaymentAsync(paymentInput, "testuser"));
    }

    #endregion

    #region GenerateFinancialReportAsync Tests

    [Fact]
    public async Task GenerateFinancialReportAsync_ReturnAnnualSummary()
    {
        // Arrange
        var coproperty = CreateSampleCoproperty();
        var units = CreateSampleUnits(coproperty.Id, 2);
        var charge = CreateSampleCharge(coproperty.Id);
        var invoices = CreateSampleInvoices(charge.Id, units, 2);

        _dbContext.Coproperties.Add(coproperty);
        _dbContext.Units.AddRange(units);
        _dbContext.Charges.Add(charge);
        _dbContext.CopropertyInvoices.AddRange(invoices);
        await _dbContext.SaveChangesAsync();

        var currentYear = DateTime.UtcNow.Year;

        // Act
        var result = await _financeService.GenerateFinancialReportAsync(coproperty.Id, currentYear);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(coproperty.Id, result.CopropertyId);
        Assert.Equal(currentYear, result.Year);
        Assert.True(result.TotalCharges > 0);
        Assert.Equal(12, result.MonthlyBalances.Count);
    }

    [Fact]
    public async Task GenerateFinancialReportAsync_CalculatesTotalCollected()
    {
        // Arrange
        var coproperty = CreateSampleCoproperty();
        var units = CreateSampleUnits(coproperty.Id, 1);
        var charge = CreateSampleCharge(coproperty.Id);
        var invoice = CreateSampleInvoice(charge.Id, units[0].Id);

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoice.Id,
            Amount = 500,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Bank Transfer",
            CreatedBy = "test",
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Coproperties.Add(coproperty);
        _dbContext.Units.AddRange(units);
        _dbContext.Charges.Add(charge);
        _dbContext.CopropertyInvoices.Add(invoice);
        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync();

        var currentYear = DateTime.UtcNow.Year;

        // Act
        var result = await _financeService.GenerateFinancialReportAsync(coproperty.Id, currentYear);

        // Assert
        Assert.True(result.TotalCollected > 0);
    }

    #endregion

    #region Helper Methods

    private Models.Coproperty CreateSampleCoproperty()
    {
        return new Models.Coproperty
        {
            Id = Guid.NewGuid(),
            Name = "Test Coproperty",
            Address = "123 Test Street",
            City = "Test City",
            PostalCode = "12345",
            Country = "Test Country",
            TotalUnits = 10,
            TotalShares = 1000,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    private List<Unit> CreateSampleUnits(Guid copropertyId, int count)
    {
        var units = new List<Unit>();
        for (int i = 0; i < count; i++)
        {
            units.Add(new Unit
            {
                Id = Guid.NewGuid(),
                CopropertyId = copropertyId,
                UnitNumber = $"Unit {i + 1}",
                Area = 50,
                Shares = 100,
                UnitType = "T2",
                CreatedAt = DateTime.UtcNow
            });
        }
        return units;
    }

    private List<Charge> CreateSampleCharges(Guid copropertyId, int count)
    {
        var charges = new List<Charge>();
        for (int i = 0; i < count; i++)
        {
            charges.Add(new Charge
            {
                Id = Guid.NewGuid(),
                CopropertyId = copropertyId,
                Name = $"Charge {i + 1}",
                Amount = 1000,
                CreatedAt = DateTime.UtcNow
            });
        }
        return charges;
    }

    private Charge CreateSampleCharge(Guid copropertyId)
    {
        return new Charge
        {
            Id = Guid.NewGuid(),
            CopropertyId = copropertyId,
            Name = "Test Charge",
            Amount = 1000,
            CreatedAt = DateTime.UtcNow
        };
    }

    private List<CopropertyInvoice> CreateSampleInvoices(Guid chargeId, List<Unit> units, int invoiceCount)
    {
        var invoices = new List<CopropertyInvoice>();
        for (int i = 0; i < invoiceCount && i < units.Count; i++)
        {
            invoices.Add(new CopropertyInvoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = $"INV-{i:D6}",
                ChargeId = chargeId,
                UnitId = units[i].Id,
                Amount = 500,
                TaxAmount = 50,
                TotalAmount = 550,
                InvoiceDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = InvoiceStatus.Pending,
                CreatedBy = "test",
                CreatedAt = DateTime.UtcNow
            });
        }
        return invoices;
    }

    private CopropertyInvoice CreateSampleInvoice(Guid chargeId, Guid unitId)
    {
        return new CopropertyInvoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = $"INV-{Guid.NewGuid():N}".Substring(0, 20),
            ChargeId = chargeId,
            UnitId = unitId,
            Amount = 1000,
            TaxAmount = 100,
            TotalAmount = 1100,
            InvoiceDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            Status = InvoiceStatus.Pending,
            CreatedBy = "test",
            CreatedAt = DateTime.UtcNow
        };
    }

    private CopropertyInvoice CreateSampleInvoice()
    {
        return new CopropertyInvoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = $"INV-{Guid.NewGuid():N}".Substring(0, 20),
            ChargeId = Guid.NewGuid(),
            UnitId = Guid.NewGuid(),
            Amount = 1000,
            TaxAmount = 100,
            TotalAmount = 1100,
            InvoiceDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            Status = InvoiceStatus.Pending,
            CreatedBy = "test",
            CreatedAt = DateTime.UtcNow
        };
    }

    #endregion
}
