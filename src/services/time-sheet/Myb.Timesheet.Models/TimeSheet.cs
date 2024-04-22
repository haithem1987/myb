namespace Myb.Timesheet.Models;

public class TimeSheet
{
    public int Id { get; set; }
    public DateTime DateEntry { get; set; }
    public Status Status { get; set; }
    public virtual ICollection<TimeEntry> TimeEntries { get; set; }
   
}