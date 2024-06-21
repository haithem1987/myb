using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Models
{
    public class Contact 
    {
        public string Credentials { get; set; }
        public ContactType Type { get; set; }
    }
}
