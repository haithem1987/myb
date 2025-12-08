using Myb.Common.Models;
using Myb.UserManager.Models;
using System.Reflection.Metadata;


namespace Myb.document.Model
{
    public class DocumentVersion :BaseEntity
    {
      public int Number { get; set; }
      //public string Content { get; set; }
      public int DocumentId { get; set; } 
      public DocumentModel Document { get; set; } 

    }
}
