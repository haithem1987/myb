using Myb.UserManager.Models;
using Myb.UserManager.Sevices;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.UserManager.Infra.GraphQl.Mutations
{
    public class UserMutation
    {
        public Task<User?> AddUser([Service] IUserService userService,User user) => userService.Add(user);
        public Task<User?> UpdateUser([Service] IUserService userService, User user) => userService.Update(user);

        public Task<User?> DeleteUser([Service] IUserService userService, int userId) => userService.Delete(userId);

    }
}
