using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Myb.Common.Models
{
    public class BaseEntity: IEntity<int>
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } = 0;
        public DateTime? CreatedDate { get; set; } 
        public DateTime? LastModifiedDate { get; set; }

    }
}
