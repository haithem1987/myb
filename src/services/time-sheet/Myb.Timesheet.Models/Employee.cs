using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class Employee:BaseEntity
{
    public string Name { get; set; }
    public string Department { get; set; }
    public string Email { get; set; }

    // Navigation properties
    public virtual ICollection<TimesheetTask> Tasks { get; set; }
}