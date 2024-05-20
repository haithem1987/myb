using System.ComponentModel.DataAnnotations;
using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class Project:BaseEntity
{
    [Required]
    public string? ProjectName { get; set; }
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public virtual ICollection<TimesheetTask>? Tasks { get; set; }
    public virtual ICollection<TimeSheet>? Timesheets { get; set; }
    public string? UserId { get; set; }
}