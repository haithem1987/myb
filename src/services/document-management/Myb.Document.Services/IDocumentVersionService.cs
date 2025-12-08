using Myb.document.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Document.Services
{
    public interface IDocumentVersionService
    {
        Task<DocumentVersion> GetDocumentVersionByIdAsync(int id);
        Task<IEnumerable<DocumentVersion>> GetAllDocumentVersionsAsync();
        Task<DocumentVersion> AddDocumentVersionAsync(DocumentVersion documentVersion);
        Task<DocumentVersion> UpdateDocumentVersionAsync(DocumentVersion documentVersion);
        Task<bool> DeleteDocumentVersionAsync(int id);
    }
}
