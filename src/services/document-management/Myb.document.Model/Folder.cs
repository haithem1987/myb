using Myb.Common.Models;
using Myb.UserManager.Models;


namespace Myb.document.Model
{
    public class Folder : BaseEntity
    {
    // public int? Id { get; set; }
        public int? ParentId { get; set; }
        public string FolderName { get; set; }

        public  virtual ICollection<DocumentModel> ?Documents { get; set; } 


        public int CreatedBy { get; set; }
        public int EditedBy { get; set; }



    }
}
