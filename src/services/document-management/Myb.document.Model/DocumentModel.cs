using Myb.Common.Models;
using Myb.UserManager.Models;

namespace Myb.document.Model
{
    public class DocumentModel : BaseEntity
    {
      
        public string DocumentName { get; set; }
       
        public int CreatedBy { get; set; } // not yet
        public int EditedBy { get; set; } // not yet 

        public DocumentType? DocumentType { get; set; }
        public DocumentStatus? Status { get; set; }
        public long DocumentSize { get; set; }

        public int? FolderId { get; set; }  
        public virtual Folder? Folder { get; set; }  

        public virtual ICollection<DocumentVersion>? Versions { get; set; }

        //public byte[] Content { get; set; } 



    }
}