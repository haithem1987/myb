using System.ComponentModel.DataAnnotations;
using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class Employee: IEntity<string?>
{
    [Key]
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Department { get; set; }
    public string? Email { get; set; }
    public bool isManager { get; set; } = false;
    public string? ManagerId { get; set; }

    // Navigation properties
    public virtual ICollection<TimeSheet>? Timesheets { get; set; } = new List<TimeSheet>();
    //public virtual ICollection<TimeOff>? TimeOffs { get; set; }
    
    public virtual ICollection<TimesheetTask>? Tasks { get; set; } = new List<TimesheetTask>();
    public DateTime? CreatedAt { get; set; } 
    public DateTime? UpdatedAt { get; set; }

}