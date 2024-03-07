using System.Net.Http.Json;
using Myb.Common.Authentification.Consts;
using Myb.Common.Authentification.Dtos;
using Myb.Common.Authentification.Exceptions;
using Myb.Common.Authentification.Interfaces;
using Myb.Common.Authentification.Settings;
using Myb.UserManager.Models;
using Newtonsoft.Json;

namespace Myb.Common.Authentification.Services
{
    public class KeycloakTokenService: IKeycloakTokenService
    {
        private readonly IHttpClientFactory _httpClientFactory; 
        private readonly KeycloakSettings _keycloakSettings; 
        public KeycloakTokenService(IHttpClientFactory httpClientFactory, KeycloakSettings keycloakSettings)
        {
            _httpClientFactory=httpClientFactory;
            _keycloakSettings=keycloakSettings;
        }
  
        public async Task<KeycloakTokenResponseDto?> GetTokenResponseAsync(
            KeycloakUserDto keycloakUserDto)
        {
            var httpClient = _httpClientFactory.CreateClient();
            var keycloakTokenRequestDto = new KeycloakTokenRequestDto
            {
                GrantType = KeycloakAccessTokenConsts.GrantTypePassword,
                ClientId = _keycloakSettings.ClientId ??
                           throw new KeycloakException(nameof(_keycloakSettings.ClientId)),
                ClientSecret = _keycloakSettings.ClientSecret ??
                               throw new KeycloakException(nameof(_keycloakSettings.ClientSecret)),
                Username = keycloakUserDto.Username,
                Password = keycloakUserDto.Password
            }; 
 

            var tokenRequestBody = KeycloakTokenUtils.GetTokenRequestBody(keycloakTokenRequestDto); 

            var response = await httpClient
                .PostAsync($"{_keycloakSettings.BaseUrl}/token", tokenRequestBody)
                .ConfigureAwait(false);
 

            var responseJson = await response.Content.ReadFromJsonAsync<KeycloakTokenResponseDto>().ConfigureAwait(false);

           /* var keycloakTokenResponseDto = JsonConvert.DeserializeObject<KeycloakTokenResponseDto>(
                responseJson);*/

            return responseJson;
        } 
    }
}