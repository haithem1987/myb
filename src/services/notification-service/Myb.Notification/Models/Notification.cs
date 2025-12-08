using System.ComponentModel.DataAnnotations;
using Myb.Common.Models;

namespace Myb.Notification.Models;

public class Notification: IEntity<string?>
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string SenderId { get; set; }

    [Required]
    public string ReceiverId { get; set; }

    [Required]
    public string Message { get; set; }

    public bool IsRead { get; set; } = false;
    
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}