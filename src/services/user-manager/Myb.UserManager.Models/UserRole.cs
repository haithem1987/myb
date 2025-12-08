using Myb.Common.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.UserManager.Models
{
    [Table(nameof(UserRole), Schema = "MYB")]
    public class UserRole : BaseEntity
    {
        [MaxLength(30)]
        [Required]
        public string Name { get; set; }
        [Browsable(false)]
        public virtual ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    }
}
