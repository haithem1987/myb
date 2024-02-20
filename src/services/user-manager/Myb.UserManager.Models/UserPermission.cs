using Myb.Common.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Myb.UserManager.Models
{
    [Table(nameof(UserPermission), Schema = "MYB")]
    public class UserPermission : BaseEntity
    {
        [MaxLength(30)]
        [Required]
        public string Name { get; set; }
    }
}