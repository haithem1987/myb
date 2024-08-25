using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public interface ITimeoffService
{
    Task<IEnumerable<TimeOff>> GetTimeOffsByEmployeeIdAsync(string employeeId);
    Task<TimeOff> AddTimeOffAsync(TimeOff timeOff);
    Task<TimeOff> UpdateTimeOffAsync(TimeOff timeOff);
}