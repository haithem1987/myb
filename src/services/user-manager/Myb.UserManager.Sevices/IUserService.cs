using Myb.UserManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Myb.UserManager.Sevices
{
    public interface IUserService
    {
        Task<User?> Add(User user);
        Task<User?> Delete(int id);
        IEnumerable<User?> GetAll();
        User? GetById(int id);
        IEnumerable<User?> GetUsersByIds(IEnumerable<int> ids);
        Task<User?> Update(User user);
    }
}
