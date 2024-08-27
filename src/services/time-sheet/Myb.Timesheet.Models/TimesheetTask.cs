using System.ComponentModel.DataAnnotations;
using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class TimesheetTask:BaseEntity
{
    [Required]
    public string name { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Description { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
    
    // Navigation properties
    public int? ProjectId { get; set; }
    public virtual Project? Project { get; set; }
    
    public string? EmployeeId { get; set; }
    public virtual Employee? Employee { get; set; }
    public string? UserId { get; set; }
}