using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Myb.Common.Repositories;
using Myb.document.Model;
using Myb.Document.EntityFramework.Infra;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Document.Services
{
    public class RootFolderService : IRootFolderService
    {
        private readonly IGenericRepository<int?, RootFolder, DocumentContext> _rootFolderRepository;
        private readonly ILogger _logger;

        public RootFolderService(IGenericRepository<int?, RootFolder, DocumentContext> rootFolderRepository, ILogger<RootFolderService> logger)
        {
            _rootFolderRepository = rootFolderRepository;
            _logger = logger;
        }

        public async Task<RootFolder> GetRootFolderByIdAsync(int id)
        {
            return await _rootFolderRepository.GetAll()
                .FirstOrDefaultAsync(rf => rf.Id == id);
        }

        public async Task<RootFolder?> GetRootFolderByUserIdAndModuleNameAsync(string userId, string moduleName)
        {
            return await _rootFolderRepository.GetAll()
                .FirstOrDefaultAsync(rf => rf.UserId == userId && rf.ModuleName == moduleName);
        }

        public async Task<IEnumerable<RootFolder>> GetAllRootFoldersAsync()
        {
            return await _rootFolderRepository.GetAll().ToListAsync();
        }

        public async Task<RootFolder> AddRootFolderAsync(RootFolder rootFolder)
        {
            rootFolder.CreatedAt = DateTime.UtcNow;
            await _rootFolderRepository.InsertAsync(rootFolder);
            return rootFolder;
        }

        public async Task<RootFolder> UpdateRootFolderAsync(RootFolder rootFolder)
        {
            try
            {
                rootFolder.UpdatedAt = DateTime.UtcNow;
                await _rootFolderRepository.UpdateAsync(rootFolder);
                return rootFolder;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating root folder");
                throw;
            }
        }

        public async Task<bool> DeleteRootFolderAsync(int id)
        {
            await _rootFolderRepository.DeleteAsync(id);
            return true;
        }
    

}
}
