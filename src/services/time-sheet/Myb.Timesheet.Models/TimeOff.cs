namespace Myb.Timesheet.Models;

public class TimeOff
{
    public int Id { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeOffType Type { get; set; }

    // Constructor
    public TimeOff()
    {
        // Initialization logic here
    }
}