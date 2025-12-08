using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class TimeEntry:BaseEntity
{
    public DateTime Date { get; set; }
    public double WorkedHours { get; set; }
    public string? Description { get; set; }
    
    //relation
    public int TimeSheetId { get; set; }
    public virtual TimeSheet? TimeSheet { get; set; }
    
}