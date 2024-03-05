using Myb.Common.Authentification.Consts;
using Myb.Common.Authentification.Dtos;
using Myb.Common.Authentification.Exceptions;
using Myb.Common.Authentification.Interfaces;
using Myb.Common.Authentification.Settings;
using Myb.UserManager.Models;
using Newtonsoft.Json;

namespace Myb.Common.Authentification.Services;

public class KeycloakTokenService(
    IHttpClientFactory httpClientFactory,
    KeycloakSettings keycloakSettings,
    User KeycloakUserDto)
    : IKeycloakTokenService
{
    public async Task<KeycloakTokenResponseDto?> GetTokenResponseAsync(
        KeycloakUserDto keycloakUserDto)
    {
        using (var httpClient = httpClientFactory.CreateClient())
        { 

            var keycloakTokenRequestDto = new KeycloakTokenRequestDto
            {
                GrantType = KeycloakAccessTokenConsts.GrantTypePassword,
                ClientId = keycloakSettings.ClientId ??
                           throw new KeycloakException(nameof(keycloakSettings.ClientId)),
                ClientSecret = keycloakSettings.ClientSecret ??
                               throw new KeycloakException(nameof(keycloakSettings.ClientSecret)),
                Username = KeycloakUserDto.Username,
                Password = KeycloakUserDto.Password
            }; 
 

            var tokenRequestBody = KeycloakTokenUtils.GetTokenRequestBody(keycloakTokenRequestDto); 

            var response = await httpClient
                .PostAsync($"{keycloakSettings.BaseUrl}/token", tokenRequestBody)
                .ConfigureAwait(false);
 

            var responseJson = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

            var keycloakTokenResponseDto = JsonConvert.DeserializeObject<KeycloakTokenResponseDto>(
                responseJson);

            return keycloakTokenResponseDto;
        }
    } 
}