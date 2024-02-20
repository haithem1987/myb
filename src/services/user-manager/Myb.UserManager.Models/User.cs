using Myb.Common.Models;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Myb.UserManager.Models
{
    [Table(nameof(User), Schema = "MYB")]
    public class User : BaseEntity
    {
        [MaxLength(30)]
        [Required]
        public string Name { get; set; }
        [Browsable(false)]
        public virtual ICollection<UserRole> Roles { get; set; } = new List<UserRole>();
    }
}
