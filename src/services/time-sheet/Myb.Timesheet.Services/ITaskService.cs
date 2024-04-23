using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public interface ITaskService
{
        Task<TimesheetTask> GetTaskByIdAsync(int id);
        Task<IEnumerable<TimesheetTask>> GetAllTasksAsync();
        Task<TimesheetTask> AddTaskAsync(TimesheetTask task);
        Task<TimesheetTask> UpdateTaskAsync(TimesheetTask task);
        Task<bool> DeleteTaskAsync(int id);
}