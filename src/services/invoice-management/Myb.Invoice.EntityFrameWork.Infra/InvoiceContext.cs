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
        public DbSet<ProductLine> ProductLines { get; set; }
        public DbSet<Contact> Contacts { get; set; }

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

                });
            modelBuilder.Entity<Contact>(
                entity =>
                {
                    entity.HasKey(x => x.Id);
                    entity.HasOne(x => x.Client)
                    .WithMany(x => x.Contacts)
                    .HasForeignKey(x => x.ClientID)
                    .OnDelete(DeleteBehavior.Restrict);
                });
            modelBuilder.Entity<ProductLine>(
                entity =>
                {
                    entity.HasKey(x => x.Id);
                    entity.HasOne(x => x.Product)
                    .WithMany(x => x.ProductLines)
                    .HasForeignKey(x => x.ProductId);

                    entity.HasOne(x => x.Invoice)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.InvoiceID);
                }
                );
                   
        }
    }
}
