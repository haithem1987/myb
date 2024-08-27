using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Models
{
    public class Product: BaseEntity
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public double? Price {  get; set; }
        public string? Unit {  get; set; }
        public ProductType? ProductType { get; set; }
        public string? UserId { get; set; }
        public int? CompanyId { get; set; }
        public bool? IsArchived { get; set; }
        public virtual ICollection<InvoiceDetails>? InvoiceDetails { get; set; }
        public int? TaxId { get; set; }
        public virtual Tax? Tax { get; set; }

    }
}
