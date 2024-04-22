namespace Myb.Timesheet.Models;

public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Department { get; set; }
    public string Email { get; set; }

    // Navigation properties
    public virtual ICollection<TimesheetTask> Tasks { get; set; }
}