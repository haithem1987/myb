using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class TimeOff:BaseEntity
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Reason { get; set; }
    public bool IsApproved { get; set; }
    public TimeOffType? Type { get; set; }
    public string? EmployeeId { get; set; } 
    public virtual Employee? Employee { get; set; }
}