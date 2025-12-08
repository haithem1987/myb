using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.document.Model
{
    public class RootFolder: BaseEntity
    {
        public string? UserId { get; set; }
        public string? ModuleName { get; set; }
        public int? FolderId { get; set; }

    }
}
