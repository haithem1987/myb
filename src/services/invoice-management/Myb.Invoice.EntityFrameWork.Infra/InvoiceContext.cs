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
        
        public InvoiceContext() 
        {
            
        }

        public InvoiceContext(DbContextOptions<InvoiceContext> options): base(options) { }

        public virtual DbSet<Models.InvoiceModel> Invoices { get; set; }

        
    }
}
