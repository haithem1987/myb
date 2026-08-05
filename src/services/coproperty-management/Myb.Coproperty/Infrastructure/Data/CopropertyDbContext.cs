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
    public DbSet<OwnerUnit> OwnerUnits { get; set; } = null!;
    public DbSet<Tenant> Tenants { get; set; } = null!;
    public DbSet<Charge> Charges { get; set; } = null!;
    public DbSet<ChargeDistribution> ChargeDistributions { get; set; } = null!;
    public DbSet<CopropertyInvoice> CopropertyInvoices { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;
    public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; } = null!;
    public DbSet<FundCall> FundCalls { get; set; } = null!;
    public DbSet<FundCallPayment> FundCallPayments { get; set; } = null!;
    public DbSet<Assembly> Assemblies { get; set; } = null!;
    public DbSet<AssemblyAttendance> AssemblyAttendances { get; set; } = null!;
    public DbSet<Intervention> Interventions { get; set; } = null!;
    public DbSet<Signalement> Signalements { get; set; } = null!;
    public DbSet<Discussion> Discussions { get; set; } = null!;
    public DbSet<DiscussionMessage> DiscussionMessages { get; set; } = null!;
    public DbSet<FundCallAuditLog> FundCallAuditLogs { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        
        // Note: PendingModelChangesWarning is only available in EF Core 9.0+
        // For EF Core 8.0, this warning suppression is not needed
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Coproperty Configuration
        modelBuilder.Entity<Models.Coproperty>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasQueryFilter(e => !e.IsDeleted);
            
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
            
            entity.Property(e => e.Currency)
                .HasConversion<string>()
                .HasMaxLength(10)
                .HasDefaultValue(Currency.EUR);
            
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
            entity.HasIndex(e => e.IsDeleted);
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
            
            // Ignore deprecated properties
            entity.Ignore(e => e.Owners);
        });

        // Owner Configuration
        modelBuilder.Entity<Owner>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasQueryFilter(e => !e.IsDeleted);
            
            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Phone)
                .HasMaxLength(50);
            
            entity.HasIndex(e => e.UserId)
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.IsDeleted);
            
            // Ignore deprecated properties
            entity.Ignore(e => e.UnitId);
            entity.Ignore(e => e.Unit);
        });
        
        // OwnerUnit Configuration (Many-to-Many relationship)
        modelBuilder.Entity<OwnerUnit>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.OwnershipPercentage)
                .HasPrecision(5, 2)
                .HasDefaultValue(100.00m);
            
            entity.HasOne(e => e.Owner)
                .WithMany(o => o.OwnerUnits)
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Unit)
                .WithMany(u => u.OwnerUnits)
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Keep historical ownership rows while allowing a unit to return to a
            // former owner later. Only active relationships must be unique.
            entity.HasIndex(e => new { e.OwnerId, e.UnitId })
                .IsUnique()
                .HasFilter("\"EndDate\" IS NULL");

            // A unit can have only one active owner. Ownership changes must close
            // the current row before creating the next historical period.
            entity.HasIndex(e => e.UnitId)
                .IsUnique()
                .HasFilter("\"EndDate\" IS NULL");
            
            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.UnitId);
            
            // Check constraint for ownership percentage
            entity.ToTable(t => t.HasCheckConstraint(
                "CHK_Ownership_Percentage", 
                "\"OwnershipPercentage\" > 0 AND \"OwnershipPercentage\" <= 100"));
        });

        // Tenant Configuration
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Phone)
                .HasMaxLength(50);

            entity.Property(e => e.MonthlyRent)
                .HasPrecision(10, 2);

            entity.Property(e => e.DepositAmount)
                .HasPrecision(10, 2);

            entity.Property(e => e.Notes)
                .HasMaxLength(2000);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Unit)
                .WithMany(u => u.Tenants)
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UnitId);
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.UnitId, e.IsActive })
                .IsUnique()
                .HasFilter("\"IsActive\" = TRUE");
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

            entity.Property(e => e.IsContribution)
                .HasDefaultValue(false);
            
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

            entity.Property(e => e.PaidAmount)
                .HasPrecision(10, 2)
                .HasDefaultValue(0);

            entity.Property(e => e.PaymentStatus)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(ChargePaymentStatus.Unpaid);

            entity.Property(e => e.PaymentTransactionId)
                .HasMaxLength(500);

            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50);
            
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

            entity.HasIndex(e => e.PaymentStatus);
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

            entity.Property(e => e.OwnerNameSnapshot)
                .HasMaxLength(200);

            entity.Property(e => e.CopropertyNameSnapshot)
                .HasMaxLength(200);

            entity.Property(e => e.UnitNumberSnapshot)
                .HasMaxLength(50);

            entity.Property(e => e.CurrencySnapshot)
                .HasConversion<string>()
                .HasMaxLength(10)
                .HasDefaultValue(Currency.EUR);
            
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

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(FundCallStatus.ToPay);

            // FRS historical-data preservation: snapshot columns so the UI can keep
            // displaying the owner/coproperty name even after the related record is deleted.
            entity.Property(e => e.OwnerNameSnapshot)
                .HasMaxLength(200);

            entity.Property(e => e.CopropertyNameSnapshot)
                .HasMaxLength(200);

            entity.Property(e => e.CurrencySnapshot)
                .HasConversion<string>()
                .HasMaxLength(10)
                .HasDefaultValue(Currency.EUR);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasOne(e => e.Coproperty)
                .WithMany()
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Owner)
                .WithMany()
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            // Inverse navigation for the optional FundCall ↔ CopropertyInvoice relationship.
            // The FK column (FundCallId) lives on CopropertyInvoice and is nullable; the
            // Invoices collection on FundCall is now a real bidirectional navigation
            // instead of a shadow FK, which was causing EF to throw at materialization
            // time on some queries (manifesting as ERR_EMPTY_RESPONSE on the client).
            entity.HasMany(e => e.Invoices)
                .WithOne(i => i.FundCall)
                .HasForeignKey(i => i.FundCallId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            entity.HasIndex(e => e.CopropertyId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Status);

            // Prevent duplicate fund calls for the same coproperty + dueDate + owner
            entity.HasIndex(e => new { e.CopropertyId, e.DueDate, e.OwnerId })
                .IsUnique()
                .HasFilter(null);
            
            // Check constraint for amount
            entity.ToTable(t => t.HasCheckConstraint(
                "CHK_FundCall_Amount", 
                "\"Amount\" >= 0"));
        });

        // FundCallPayment Configuration
        modelBuilder.Entity<FundCallPayment>(entity =>
        {
            entity.HasKey(e => e.Id);

            // UpdatedAt is required by IEntity but was never added to the DB table
            entity.Ignore(e => e.UpdatedAt);

            entity.Property(e => e.Amount)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(e => e.Justificatif)
                .HasMaxLength(1000);

            entity.Property(e => e.JustificatifFileName)
                .HasMaxLength(255);

            entity.Property(e => e.JustificatifContentType)
                .HasMaxLength(100);

            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(100);

            entity.Property(e => e.ValidationStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending")
                .IsRequired();

            entity.Property(e => e.RejectionReason)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.JustificatifFile)
                .WithOne(file => file.Payment)
                .HasForeignKey<FundCallPaymentJustificatifFile>(file => file.FundCallPaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.FundCall)
                .WithMany(f => f.Payments)
                .HasForeignKey(e => e.FundCallId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.FundCallId);
        });

        modelBuilder.Entity<FundCallPaymentJustificatifFile>(entity =>
        {
            entity.HasKey(file => file.FundCallPaymentId);
            entity.Property(file => file.FileData)
                .HasColumnType("bytea")
                .IsRequired();
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

        // Intervention Configuration
        modelBuilder.Entity<Intervention>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(e => e.InterventionType)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Priority)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(Priority.Normal);

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(InterventionStatus.Draft);

            entity.Property(e => e.ProviderName)
                .HasMaxLength(200);

            entity.Property(e => e.ProviderPhone)
                .HasMaxLength(50);

            entity.Property(e => e.ProviderEmail)
                .HasMaxLength(200);

            entity.Property(e => e.EstimatedCost)
                .HasPrecision(10, 2);

            entity.Property(e => e.ActualCost)
                .HasPrecision(10, 2);

            entity.Property(e => e.Notes)
                .HasMaxLength(2000);

            entity.Property(e => e.Resolution)
                .HasMaxLength(2000);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Coproperty)
                .WithMany(c => c.Interventions)
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Unit)
                .WithMany()
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.MaintenanceRequest)
                .WithMany()
                .HasForeignKey(e => e.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CopropertyId);
            entity.HasIndex(e => e.PlannedDate);
        });

        // Signalement Configuration
        modelBuilder.Entity<Signalement>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.ReporterName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Zone)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(SignalementStatus.EnCours);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(e => e.PhotoUrl)
                // The UI currently sends an image as a data URL. PostgreSQL's text
                // type is required here because a base64 image is much larger than
                // a conventional 500-character object-storage URL.
                .HasColumnType("text");

            entity.Property(e => e.SyndicComment)
                .HasMaxLength(2000);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Coproperty)
                .WithMany()
                .HasForeignKey(e => e.CopropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CopropertyId);
            entity.HasIndex(e => e.ReportedBy);
        });

        modelBuilder.Entity<Discussion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Kind).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Coproperty).WithMany().HasForeignKey(e => e.CopropertyId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.CopropertyId, e.UpdatedAt });
        });

        modelBuilder.Entity<DiscussionMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AuthorId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AuthorName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AuthorRole).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Body).IsRequired().HasMaxLength(5000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Discussion).WithMany(d => d.Messages).HasForeignKey(e => e.DiscussionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.DiscussionId, e.CreatedAt });
        });

        // FundCallAuditLog Configuration — added per FRS-FCF-LCM-2026-001
        // to maintain financial audit integrity for the Call for Funds lifecycle.
        modelBuilder.Entity<FundCallAuditLog>(entity =>
        {
            // The legacy FundCallAuditLogs table in OVH is owned by avnadmin
            // and grants the application role no access. Keep it untouched for
            // retention and persist new application audit history separately.
            entity.ToTable("FundCallAuditEvents");

            entity.HasKey(e => e.Id);

            // Audit entries are immutable. UpdatedAt only exists to satisfy the
            // shared IEntity contract and is intentionally not persisted. This
            // also keeps compatibility with the existing staging table, which
            // is owned by the managed database administrator role.
            entity.Ignore(e => e.UpdatedAt);

            entity.Property(e => e.Action)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(e => e.PreviousStatus)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.NewStatus)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.Reason)
                .HasMaxLength(1000);

            entity.Property(e => e.ActorRole)
                .HasMaxLength(50);

            entity.Property(e => e.ActorDisplayName)
                .HasMaxLength(200);

            entity.Property(e => e.MetadataJson)
                .HasColumnType("text");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // The FK to FundCalls is intentionally NOT declared as a navigation:
            // we want the audit row to survive the (rare) hard-delete of a draft
            // so the deletion itself remains traceable. The Id is stored as a
            // plain Guid.
            entity.HasIndex(e => e.FundCallId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.FundCallId, e.CreatedAt });
        });
    }
}
