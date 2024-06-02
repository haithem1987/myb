using Microsoft.AspNetCore.Http;
using Myb.document.Model;


namespace Myb.Document.Services
{
    public interface IDocumentService
    {
        Task<DocumentModel> GetDocumentByIdAsync(int id);
       Task<IEnumerable<DocumentModel>> GetAllDocumentsAsync();
 
        Task<DocumentModel> AddDocumentAsync(DocumentModel document);

        Task<DocumentModel> UpdateDocumentAsync(DocumentModel document);
         Task<bool> DeleteDocumentAsync(int id);

    }
}
