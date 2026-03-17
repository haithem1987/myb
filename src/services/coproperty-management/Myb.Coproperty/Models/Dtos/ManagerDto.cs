namespace Myb.Coproperty.Models.Dtos
{
    public record ManagerDto(string Id, string FirstName, string LastName, string Email)
    {
        public string FullName => $"{FirstName} {LastName}".Trim();
    }
}
