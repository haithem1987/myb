namespace Myb.Coproperty.Models.Dtos
{
    public record KeycloakUserSearchDto(
        string Id,
        string Email,
        string FirstName,
        string LastName,
        string? Phone,
        bool Enabled,
        bool EmailVerified,
        List<string> Roles);
}
