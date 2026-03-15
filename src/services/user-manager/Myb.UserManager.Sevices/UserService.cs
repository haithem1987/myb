

using HotChocolate.Authorization;
using Myb.Common.Authentification.Dtos;
using Myb.Common.Authentification.Exceptions;
using Myb.Common.Authentification.Interfaces;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Common.Repositories;
using Myb.UserManager.EntityFrameWork.Infra;
using Myb.UserManager.Models;

namespace Myb.UserManager.Sevices
{
    public class UserService : IUserService 
    {
        private readonly IGenericRepository<int?,User, UserContext> _genericRepo;
        private readonly IKeycloakTokenService _keycloakTokenService;
        private readonly IEmailPublisher _emailPublisher;

        public UserService(IGenericRepository<int?, User, UserContext> genericRepository, IKeycloakTokenService keycloakTokenService, IEmailPublisher emailPublisher)
        {
            _genericRepo = genericRepository;
            _keycloakTokenService = keycloakTokenService;
            _emailPublisher = emailPublisher;
        }

        public User? GetById(int? id)
        {
            return _genericRepo.GetById(id);
        }
        public IEnumerable<User?> GetAll() 
        {
            return _genericRepo.GetAll();
        }
        public IEnumerable<User?> GetUsersByIds(IEnumerable<int?> ids)
        {
            return _genericRepo.GetByIds(ids);
        }

        public async Task<User?> Add(User user)
        {
            var result = await _genericRepo.InsertAsync(user);

            if (result.Entity != null)
            {
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = result.Entity.Username,
                    Subject = "Bienvenue sur MYB Platform",
                    HtmlBody = $@"<h1>Bienvenue {result.Entity.Name} !</h1>
                        <p>Votre compte a été créé avec succès sur la plateforme MYB.</p>
                        <p>Vous pouvez maintenant vous connecter et accéder à tous nos services.</p>
                        <br/>
                        <p>Cordialement,<br/>L'équipe MYB</p>",
                    Source = "user-manager"
                });
            }

            return result.Entity;
        }
        public async Task<User?> Update(User user) 
        {
            var result = await _genericRepo.UpdateAsync(user);
            return result.Entity;
        }
        public async Task<User?> Delete(int? id) 
        {
            var result = await _genericRepo.DeleteAsync(id);
            return result.Entity;
        }
        
        public async Task<KeycloakTokenResponseDto> AuthorizeAsync(KeycloakUserDto keycloakUserDto)
        {
            try
            {
                var response = await _keycloakTokenService.GetTokenResponseAsync(keycloakUserDto)
                    .ConfigureAwait(false);
                return response;
            }
            catch (KeycloakException ex)
            {
                throw;
            }
         
        }
        [Authorize(Roles = new [] { "Guest" })]
        public string GetMessage()
        {
            return "Hello from UserService!";
        }

    }
}
