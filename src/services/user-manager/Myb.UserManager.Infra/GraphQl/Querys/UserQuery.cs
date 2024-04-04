using Myb.UserManager.Models;
using Myb.UserManager.Sevices;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Myb.Common.Authentification.Dtos;
using HotChocolate.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Myb.UserManager.Infra.GraphQl.Querys
{
    public class UserQuery
    {
        public IEnumerable<User?> GetUsers([Service] IUserService userService) => userService.GetAll();
        [Authorize]
        public User GetUser() => new User() { Name="Koutaiba",Username="Kout1999"};

        public User? GetUserById([Service] IUserService userService,int id) => userService.GetById(id);
        public IEnumerable<User?> GetUserByIds([Service] IUserService userService, int[] ids) =>
            userService.GetUsersByIds(ids);
        public String GetMessage([Service] IUserService userService) =>
            userService.GetMessage();
        public string? GetMe(ClaimsPrincipal? user)
        {
            return user?.FindFirstValue(ClaimTypes.NameIdentifier);
        }
        [Authorize (Roles = new [] { "Guest" })]
        public string GetWelcome()
        {
            return "Welcome To Custom Authentication Servies In GraphQL In Pure Code First";
        }
        [Authorize]
        public List<string> GetAuthorized([Service] IHttpContextAccessor contextAccessor)
        {
            return contextAccessor.HttpContext.User.Claims.Select(x => $"{x.Type} : {x.Value}").ToList();
        }
        public KeycloakTokenResponseDto GetToken([Service] IUserService userService,  KeycloakUserDto keycloakUserDto) =>
            userService.AuthorizeAsync(keycloakUserDto).GetAwaiter().GetResult();

    }
}
