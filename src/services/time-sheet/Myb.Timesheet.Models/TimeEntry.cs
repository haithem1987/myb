namespace Myb.Timesheet.Models;

public class TimeEntry
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public double WorkedHours { get; set; }
    public string Description { get; set; }
    
    //relation
    public int TimeSheetId { get; set; }
    public virtual TimeSheet TimeSheet { get; set; }
    
}