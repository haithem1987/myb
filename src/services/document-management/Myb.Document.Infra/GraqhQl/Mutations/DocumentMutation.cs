using HotChocolate;
using Microsoft.AspNetCore.Http;
using Myb.document.Model;
using Myb.Document.Services;


namespace Myb.Document.Infra.GraphQl.Mutations
{
    public class DocumentMutation
    {
        //Document Mutation

        public async Task<DocumentModel> AddDocument([Service] IDocumentService documentService, DocumentModel document )
        {
            return await documentService.AddDocumentAsync(document);
        }

        public async Task<DocumentModel> UpdateDocument([Service] IDocumentService documentService, DocumentModel document)
        {
            return await documentService.UpdateDocumentAsync(document);
        }
      
        public async Task<bool> DeleteDocument([Service] IDocumentService documentService, int id)
        {
            return await documentService.DeleteDocumentAsync(id);
        }


        //Folder Mutation

        public async Task<Folder> AddFolder([Service] IFolderService folderService, Folder folder)
        {
            return await folderService.AddFolderAsync(folder);
        }

        public async Task<Folder> UpdateFolder([Service] IFolderService folderService, Folder folder)
        {
            return await folderService.UpdateFolderAsync(folder);
        }


        public async Task<bool> DeleteFolder([Service] IFolderService folderService, int id)
        {
            return await folderService.DeleteFolderAsync(id);
        }

        //add document version
        public async Task<DocumentVersion> AddDocumentVersion([Service] IDocumentVersionService documentVersionService, DocumentVersion documentVersion)
        {
            return await documentVersionService.AddDocumentVersionAsync(documentVersion);
        }
        //update document version
        public async Task<DocumentVersion> UpdateDocumentVersion([Service] IDocumentVersionService documentVersionService, DocumentVersion documentVersion)
        {
            return await documentVersionService.UpdateDocumentVersionAsync(documentVersion);
        }
    }

   
}
