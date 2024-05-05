using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class TimeOff:BaseEntity
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeOffType Type { get; set; }
    
}