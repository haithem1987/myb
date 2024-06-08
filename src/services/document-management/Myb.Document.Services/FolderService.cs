using Myb.Common.Repositories;
using Myb.Document.EntityFramework.Infra;
using Myb.document.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;


namespace Myb.Document.Services
{
    public class FolderService : IFolderService
    {
        private readonly IGenericRepository<int?, Folder, DocumentContext> _folderRepository;
        private readonly ILogger _logger;

        public FolderService(IGenericRepository<int?, Folder, DocumentContext> folderRepository, ILogger<FolderService> logger)
        {
            _folderRepository = folderRepository;
            _logger = logger;
        }
        /*
        public async Task<Folder> GetFolderByIdAsync(int id)
        {
            return await Task.FromResult<Folder>(_folderRepository.GetById(id)!);

        }*/
        public async Task<Folder> GetFolderByIdAsync(int id)
        {
            return await _folderRepository.GetAll().Include(f => f.Documents).FirstOrDefaultAsync(f => f.Id == id);
        }

        //get all folders including all documents
        public async Task<IEnumerable<Folder>> GetAllFoldersAsync()
        {
            return await _folderRepository.GetAll().Include(f => f.Documents).ToListAsync();
        }

        /*

        public async Task<IEnumerable<Folder>> GetAllFoldersAsync()
        {
            return await _folderRepository.GetAll().ToListAsync();
        }*/

        public async Task<Folder> AddFolderAsync(Folder folder)
        {
            folder.CreatedAt = DateTime.UtcNow;
         
            await _folderRepository.InsertAsync(folder);
            return folder;
        }

        public async Task<Folder> UpdateFolderAsync(Folder folder)
        {
            try
            {
                _logger.LogInformation("Updating folder with ID {FolderId}", folder.Id);
              
                _logger.LogInformation("Folder state before update: {@Folder}", folder);

                await _folderRepository.UpdateAsync(folder);

                _logger.LogInformation("Folder updated successfully with ID {FolderId}", folder.Id);
                _logger.LogInformation("Folder state after update: {@Folder}", folder);

                return folder;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating folder with ID {FolderId}", folder.Id);
                throw;
            }
        }

        public async Task<bool> DeleteFolderAsync(int id)
        {
            await _folderRepository.DeleteAsync(id);
            return true;
        }
    }
}

