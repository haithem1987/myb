using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Data;

/// <summary>
/// Database context for Coproperty management
/// </summary>
public class CopropertyDbContext : DbContext
{
    public CopropertyDbContext(DbContextOptions<CopropertyDbContext> options)
        : base(options)
    {
    }

    public DbSet<Models.Coproperty> Coproperties { get; set; } = null!;
    public DbSet<Unit> Units { get; set; } = null!;
    public DbSet<Owner> Owners { get; set; } = null!;
    public DbSet<Charge> Charges { get; set; } = null!;
    public DbSet<ChargeDistribution> ChargeDistributions { get; set; } = null!;
    public DbSet<CopropertyInvoice> CopropertyInvoices { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;
    public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; } = null!;
    public DbSet<FundCall> FundCalls { get; set; } = null!;
    public DbSet<Assembly> Assemblies { get; set; } = null!;
    public DbSet<AssemblyAttendance> AssemblyAttendances { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        
        // Suppress PendingModelChangesWarning in Development
        // This allows the service to start even if migrations are pending,
        // useful during development iterations
        optionsBuilder.ConfigureWarnings(w =>
            w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Coproperty Configuration
        modelBuilder.Entity<Models.Coproperty>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Address)
                .IsRequired()
                .HasMaxLength(500);
            
            entity.Property(e => e.City)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.PostalCode)
                .IsRequired()
                .HasMaxLength(20);
            
            entity.Property(e => e.Country)
                .HasMaxLength(100)
                .HasDefaultValue("France");
            
            entity.Property(e => e.Description)
                .HasMaxLength(2000);
            
            entity.Property(e => e.CommonAreas)
                .HasMaxLength(1000);
            
            entity.Property(e => e.ManagerName)
                .HasMaxLength(200);
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.ManagerId)
                .IsRequired(false); // Make ManagerId optional
            
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.ManagerId);
        });

        // Unit Configuration
        modelBuilder.Entity<Unit>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.UnitNumber)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.Area)
                .HasPrecision(10, 2);
            
            entity.Property(e => e.UnitType)
                .HasMaxLength(50);
            
            entity.Property(e => e.Description)
                .HasMaxLength(1000);
            
            entity.HasOne(e => e.Coproperty)
                .WithMany(c => c.Units)
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => new { e.CopropertyId, e.UnitNumber })
                .IsUnique();
            
            entity.HasIndex(e => e.CopropertyId);
        });

        // Owner Configuration
        modelBuilder.Entity<Owner>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.OwnershipPercentage)
                .HasPrecision(5, 2)
                .HasDefaultValue(100.00m);
            
            entity.HasOne(e => e.Unit)
                .WithMany(u => u.Owners)
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.UnitId);
            
            // Check constraint for ownership percentage
            entity.ToTable(t => t.HasCheckConstraint(
                "CHK_Ownership_Percentage", 
                "\"OwnershipPercentage\" > 0 AND \"OwnershipPercentage\" <= 100"));
        });

        // Charge Configuration
        modelBuilder.Entity<Charge>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description)
                .HasMaxLength(2000);
            
            entity.Property(e => e.TotalAmount)
                .HasPrecision(10, 2)
                .IsRequired();
            
            entity.Property(e => e.ChargeType)
                .HasConversion<string>()
                .HasMaxLength(50);
            
            entity.Property(e => e.Frequency)
                .HasConversion<string>()
                .HasMaxLength(50);
            
            entity.Property(e => e.DistributionMethod)
                .HasConversion<string>()
                .HasMaxLength(50);
            
            entity.HasOne(e => e.Coproperty)
                .WithMany(c => c.Charges)
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.CopropertyId);
            entity.HasIndex(e => e.IsActive);
            
            // Check constraint for amount
            entity.ToTable(t => t.HasCheckConstraint(
                "CHK_Charge_Amount", 
                "\"TotalAmount\" >= 0"));
        });

        // ChargeDistribution Configuration
        modelBuilder.Entity<ChargeDistribution>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Amount)
                .HasPrecision(10, 2)
                .IsRequired();
            
            entity.HasOne(e => e.Charge)
                .WithMany(c => c.Distributions)
                .HasForeignKey(e => e.ChargeId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Unit)
                .WithMany(u => u.ChargeDistributions)
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => new { e.ChargeId, e.UnitId })
                .IsUnique();
        });

        // CopropertyInvoice Configuration
        modelBuilder.Entity<CopropertyInvoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.InvoiceNumber)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.Amount)
                .HasPrecision(10, 2)
                .IsRequired();
            
            entity.Property(e => e.TaxAmount)
                .HasPrecision(10, 2)
                .HasDefaultValue(0);
            
            entity.Property(e => e.TotalAmount)
                .HasPrecision(10, 2)
                .IsRequired();
            
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(InvoiceStatus.Pending);
            
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50);
            
            entity.Property(e => e.Notes)
                .HasMaxLength(2000);
            
            entity.HasOne(e => e.Charge)
                .WithMany(c => c.Invoices)
                .HasForeignKey(e => e.ChargeId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Unit)
                .WithMany(u => u.Invoices)
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Owner)
                .WithMany(o => o.Invoices)
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.UnitId);
            entity.HasIndex(e => e.OwnerId);
        });

        // Payment Configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Amount)
                .HasPrecision(10, 2)
                .IsRequired();
            
            entity.Property(e => e.PaymentMethod)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.TransactionId)
                .HasMaxLength(200);
            
            entity.Property(e => e.Notes)
                .HasMaxLength(2000);
            
            entity.HasOne(e => e.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.InvoiceId);
        });

        // MaintenanceRequest Configuration
        modelBuilder.Entity<MaintenanceRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(2000);
            
            entity.Property(e => e.Category)
                .HasConversion<string>()
                .HasMaxLength(50);
            
            entity.Property(e => e.Priority)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(Priority.Normal);
            
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(MaintenanceStatus.Pending);
            
            entity.Property(e => e.EstimatedCost)
                .HasPrecision(10, 2);
            
            entity.Property(e => e.ActualCost)
                .HasPrecision(10, 2);
            
            entity.HasOne(e => e.Coproperty)
                .WithMany(c => c.MaintenanceRequests)
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Unit)
                .WithMany()
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CopropertyId);
        });

        // FundCall Configuration
        modelBuilder.Entity<FundCall>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Amount)
                .HasPrecision(10, 2)
                .IsRequired();
            
            entity.Property(e => e.Description)
                .HasMaxLength(2000)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasOne(e => e.Coproperty)
                .WithMany()
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.CopropertyId);
            entity.HasIndex(e => e.IsActive);
            
            // Check constraint for amount
            entity.ToTable(t => t.HasCheckConstraint(
                "CHK_FundCall_Amount", 
                "\"Amount\" >= 0"));
        });

        // Assembly Configuration
        modelBuilder.Entity<Assembly>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Location)
                .HasMaxLength(500);
            
            entity.Property(e => e.Agenda)
                .HasMaxLength(5000);
            
            entity.Property(e => e.Minutes)
                .HasMaxLength(10000);
            
            entity.Property(e => e.AssemblyType)
                .HasConversion<string>()
                .HasMaxLength(50);
            
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);
            
            entity.HasOne(e => e.Coproperty)
                .WithMany()
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.CopropertyId);
            entity.HasIndex(e => e.MeetingDate);
            entity.HasIndex(e => e.Status);
        });

        // AssemblyAttendance Configuration
        modelBuilder.Entity<AssemblyAttendance>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.ProxyHolderName)
                .HasMaxLength(200);
            
            entity.HasOne(e => e.Assembly)
                .WithMany(a => a.Attendances)
                .HasForeignKey(e => e.AssemblyId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.AssemblyId);
            entity.HasIndex(e => e.OwnerId);
        });
    }
}
