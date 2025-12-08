
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

    // Define your DbSets here (e.g., tables)
    public DbSet<StripePayment> Payments { get; set; }
}
