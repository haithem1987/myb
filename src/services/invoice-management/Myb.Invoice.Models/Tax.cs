using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Models
{
    public class Tax : BaseEntity
    {
        public string? Name { get; set; }
        public double? Value { get; set; }
        public bool? IsPercentage { get; set; }
        public virtual ICollection<Product>? Products { get; set; }
    }
}
