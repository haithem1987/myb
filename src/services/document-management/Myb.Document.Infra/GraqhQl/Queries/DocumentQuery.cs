using HotChocolate;
using Myb.document.Model;
using Myb.Document.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Myb.Document.Infra.GraphQl.Queries
{
    public class DocumentQuery
    {
        //Document Query

        public async Task<DocumentModel> GetDocumentById([Service] IDocumentService documentService, int id)
        {
            return await documentService.GetDocumentByIdAsync(id);
        }

        public async Task<IEnumerable<DocumentModel>> GetAllDocuments([Service] IDocumentService documentService)
        {
            return await documentService.GetAllDocumentsAsync();
        }

        //Folder Query

        public async Task<Folder> GetFolderById([Service] IFolderService folderService, int id)
        {
            return await folderService.GetFolderByIdAsync(id);
        }

        public async Task<IEnumerable<Folder>> GetFoldersByParentId([Service] IFolderService folderService, int parentId)
        {
            return await folderService.GetFoldersByParentIdAsync(parentId);
        }

        public async Task<IEnumerable<Folder>> GetAllFolders([Service] IFolderService folderService)
        {
            return await folderService.GetAllFoldersAsync();
        }
        /*  //version query
          public async Task<Version> GetVersionById([Service] IDocumentVersionService versionService, int id)
          {
              return await versionService.GetVersionByIdAsync(id);
          }*/


        // RootFolder Queries
        public async Task<RootFolder> GetRootFolderById([Service] IRootFolderService rootFolderService, int id)
        {
            return await rootFolderService.GetRootFolderByIdAsync(id);
        }

        public async Task<RootFolder?> GetRootFolderByUserIdAndModuleName([Service] IRootFolderService rootFolderService, string userId, string moduleName)
        {
            return await rootFolderService.GetRootFolderByUserIdAndModuleNameAsync(userId, moduleName);
        }

        public async Task<IEnumerable<RootFolder>> GetAllRootFolders([Service] IRootFolderService rootFolderService)
        {
            return await rootFolderService.GetAllRootFoldersAsync();
        }
    }
}
