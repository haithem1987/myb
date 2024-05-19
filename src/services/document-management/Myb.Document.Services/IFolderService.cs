using Myb.document.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Document.Services
{
    public interface IFolderService
    {
        Task<Folder> GetFolderByIdAsync(int id);
        Task<IEnumerable<Folder>> GetAllFoldersAsync();
        Task<Folder> AddFolderAsync(Folder folder);
        Task<Folder> UpdateFolderAsync(Folder folder);
        Task<bool> DeleteFolderAsync(int id);
    }
}
