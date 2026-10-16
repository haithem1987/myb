
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Myb.Payment.Models;

namespace Myb.Payment.EntityFrameWork.Infra;
public class PaymentContext : DbContext
{
    private readonly IConfiguration _configuration;
    public PaymentContext()
    {
        
    }
    public PaymentContext(DbContextOptions<PaymentContext> options, IConfiguration configuration)
        : base(options)
    {
        _configuration = configuration;
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (optionsBuilder.IsConfigured) return;
        
        var connectionString = _configuration.GetConnectionString("PaymentDBConnection");
        optionsBuilder.UseNpgsql(connectionString);
        
    }

    public DbSet<StripePayment> Payments { get; set; }
    public DbSet<BankStatement> BankStatements { get; set; }
    public DbSet<BankTransaction> BankTransactions { get; set; }
    public DbSet<ReconciliationResult> ReconciliationResults { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BankStatement>()
            .HasMany(s => s.Transactions)
            .WithOne(t => t.BankStatement)
            .HasForeignKey(t => t.BankStatementId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BankStatement>()
            .HasMany(s => s.Results)
            .WithOne(r => r.BankStatement)
            .HasForeignKey(r => r.BankStatementId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReconciliationResult>()
            .HasOne(r => r.BankTransaction)
            .WithMany()
            .HasForeignKey(r => r.BankTransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ReconciliationResult>()
            .Property(r => r.Status)
            .HasConversion<string>();
    }
}
