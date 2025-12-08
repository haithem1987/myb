using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class TimeSheet:BaseEntity
{
    public DateTime Date { get; set; }
    public float WorkedHours { get; set; }
    public int? Quantity { get; set; } = 0;
    public TimeUnit? TimeUnit { get; set; } 
    public string? Description { get; set; }
    public ApprovalStatus Status { get; set; }
    public int ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public virtual Project? Project { get; set; }
    public string? UserId { get; set; }
    public string? Username{ get; set; }
}