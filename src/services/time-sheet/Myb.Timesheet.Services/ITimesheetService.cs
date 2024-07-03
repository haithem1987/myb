using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public interface ITimesheetService
{
    Task<TimeSheet> CreateTimeSheetAsync(TimeSheet timesheet);
    Task<TimeSheet> GetTimeSheetAsync(int timesheetId);
    Task<IEnumerable<TimeSheet>> GetAllTimeSheetsAsync();
    Task<TimeSheet> UpdateTimeSheetAsync(TimeSheet timesheet);
    Task<bool> DeleteTimeSheetAsync(int timesheetId);
    
    // Additional methods related to timesheet operations
    Task ApproveTimeSheetAsync(int timesheetId);
    Task RejectTimeSheetAsync(int timesheetId, string reason);
    Task<IEnumerable<TimeSheet>> GetTimeSheetsByUserIdAsync(string userId);
    Task<IEnumerable<TimeSheet>> GetTimeSheetsByEmployeeIdAsync(int employeeId);
    Task<List<TimeSheet>> UpdateMultipleTimesheetsAsync(List<TimeSheet> timesheets);
}