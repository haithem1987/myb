using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Myb.Common.Authentification.Dtos;
using Myb.Common.Authentification.Exceptions;
using Myb.Common.Authentification.Interfaces;
using Myb.Common.Repositories;
using Myb.UserManager.EntityFrameWork.Infra;
using Myb.UserManager.Models;

namespace Myb.UserManager.Sevices
{
    public class UserService : IUserService 
    {
        private readonly IGenericRepository<int,User, UserContext> _genericRepo;
        private readonly IKeycloakTokenService _keycloakTokenService; 

        public UserService(IGenericRepository<int, User, UserContext> genericRepository ,IKeycloakTokenService keycloakTokenService)
        {
            _genericRepo = genericRepository;
            _keycloakTokenService = keycloakTokenService;
        }
        public User? GetById(int id)
        {
            return _genericRepo.GetById(id);
        }
        public IEnumerable<User?> GetAll() 
        {
            return _genericRepo.GetAll();
        }
        public IEnumerable<User?> GetUsersByIds(IEnumerable<int> ids)
        {
            return _genericRepo.GetByIds(ids);
        }
        public async Task<User?> Add(User user)
        {
            var result = await _genericRepo.InsertAsync(user);
            return result.Entity;
        }
        public async Task<User?> Update(User user) 
        {
            var result = await _genericRepo.UpdateAsync(user);
            return result.Entity;
        }
        public async Task<User?> Delete(int id) 
        {
            var result = await _genericRepo.DeleteAsync(id);
            return result.Entity;
        }
        
        [HttpPost("token")]
        public async Task<IActionResult> AuthorizeAsync([FromBody] KeycloakUserDto keycloakUserDto)
        {
            try
            {
                var response = await _keycloakTokenService.GetTokenResponseAsync(keycloakUserDto)
                    .ConfigureAwait(false);

                return new OkObjectResult(response);
            }
            catch (KeycloakException)
            {

                return new BadRequestObjectResult("Authorization has failed!");
            }
            catch (Exception)
            {
                return new BadRequestObjectResult("An error has occured!");
            }
        }

    }
}
