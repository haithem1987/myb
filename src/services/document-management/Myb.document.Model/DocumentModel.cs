using Myb.Common.Models;
using Myb.UserManager.Models;

namespace Myb.document.Model
{
    public class DocumentModel : BaseEntity
    {
      
        public string? DocumentName { get; set; }
       
        public int? CreatedBy { get; set; } 
        public int? EditedBy { get; set; } 

        public DocumentType? DocumentType { get; set; }
        public DocumentStatus? Status { get; set; }
        public long? DocumentSize { get; set; }

        public int? FolderId { get; set; }  
        public virtual Folder? Folder { get; set; }  

        public virtual ICollection<DocumentVersion>? Versions { get; set; }

        /*public string? Content { get; set; } */



    }
}