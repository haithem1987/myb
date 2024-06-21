using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.EntityFrameWork.Infra
{
    public class InvoiceContext : DbContext
    {
        private readonly IConfiguration _configuration;

        public InvoiceContext() 
        {
            
        }

        public InvoiceContext(DbContextOptions<InvoiceContext> options, IConfiguration configuration) : base(options) {
            _configuration = configuration;
        }

        public DbSet<InvoiceModel> Invoices { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InvoiceModel>(
                entity =>
                {
                    entity.HasKey(x => x.Id);
                    entity.HasOne(x => x.Client)
                    .WithMany(x => x.Invoices)
                    .HasForeignKey(x => x.ClientID)
                    .OnDelete(DeleteBehavior.Restrict);

                    entity.HasMany(x => x.Products)
                    .WithMany(x => x.Invoices)
                    .UsingEntity(j => j.ToTable("T_Invoices_Products"));
                    ;
                });                            
                   
        }
    }
}
