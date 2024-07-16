using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Models
{
    public class InvoiceDetails : BaseEntity
    {
        public int? ProductId { get; set; } 
        public virtual Product? Product { get; set; }
        public double? Quantity { get; set; }
        public double? UnitPrice { get; set; }
        public double? TotalPrice { get; set; }
        public int? InvoiceID { get; set; }
        public virtual InvoiceModel? Invoice { get; set; }
    }
}
