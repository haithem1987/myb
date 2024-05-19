using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class TimeSheet:BaseEntity
{
    public DateTime DateEntry { get; set; }
    public Status Status { get; set; }
    public virtual ICollection<TimeEntry>? TimeEntries { get; set; }
   
}