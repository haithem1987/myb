using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Myb.Common.Models
{
    public class BaseEntity: IEntity<int>
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;

    }
}
