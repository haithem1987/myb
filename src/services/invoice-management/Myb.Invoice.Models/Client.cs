using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Models
{
    public class Client : BaseEntity
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Address {  get; set; }
        public ClientType? ClientType { get; set; }
        public string? UserId { get; set; }
        public int? CompanyId { get; set; }
        public bool? IsArchived { get; set; }
        public virtual ICollection<Contact>?  Contacts { get; set; }
        
        public virtual ICollection<InvoiceModel>? Invoices {  get; set; }
    }
}
