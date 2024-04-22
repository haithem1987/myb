namespace Myb.Timesheet.Models;

public class TimesheetTask
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public int ProjectId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Description { get; set; }

    // Navigation properties
    public virtual Employee Employee { get; set; }
    public virtual Project Project { get; set; }
}