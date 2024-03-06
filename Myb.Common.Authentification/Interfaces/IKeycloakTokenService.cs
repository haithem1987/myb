using Myb.Common.Authentification.Dtos;

namespace Myb.Common.Authentification.Interfaces
{
    public interface IKeycloakTokenService
    {
        Task<KeycloakTokenResponseDto?> GetTokenResponseAsync(KeycloakUserDto keycloakUserDto);
    }
}