using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;


namespace Myb.Invoice.Models
{
    public class InvoiceModel : BaseEntity
    {
        public string? InvoiceNum { get; set; }
        public string? UserId { get; set; }
        public int? CompanyId { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public DateTime? DueDate { get; set;}
        public double? TotalAmount { get; set; }
        public double? SubTotal { get; set;}
        public string? Status { get; set; }
        public string? ClientName { get; set; }
        public string? ClientAddress { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierAddress { get; set; }
        public string? image {  get; set; }
    }
}
