using Myb.UserManager.Models;
using Myb.UserManager.Sevices;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Myb.Common.Authentification.Dtos;

namespace Myb.UserManager.Infra.GraphQl.Querys
{
    public class UserQuery
    {
        public IEnumerable<User?> GetUsers([Service] IUserService userService) => userService.GetAll();
        public User? GetUserById([Service] IUserService userService,int id) => userService.GetById(id);
        public IEnumerable<User?> GetUserByIds([Service] IUserService userService, int[] ids) =>
            userService.GetUsersByIds(ids);
        public KeycloakTokenResponseDto GetToken([Service] IUserService userService,  KeycloakUserDto keycloakUserDto) =>
            userService.AuthorizeAsync(keycloakUserDto).GetAwaiter().GetResult();

    }
}
