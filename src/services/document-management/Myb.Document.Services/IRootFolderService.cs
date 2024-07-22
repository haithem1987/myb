using Myb.document.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Document.Services
{
    public interface IRootFolderService
    {
        Task<RootFolder> GetRootFolderByIdAsync(int id);
        Task<RootFolder> GetRootFolderByUserIdAndModuleNameAsync(string userId, string moduleName);

        Task<IEnumerable<RootFolder>> GetAllRootFoldersAsync();
        Task<RootFolder> AddRootFolderAsync(RootFolder rootFolder);
        Task<RootFolder> UpdateRootFolderAsync(RootFolder rootFolder);
        Task<bool> DeleteRootFolderAsync(int id);
  

    }
}
