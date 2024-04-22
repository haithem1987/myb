using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public interface ITaskService
{
        Task<TimesheetTask> AddTask(TimesheetTask task);
        Task<TimesheetTask> UpdateTask(TimesheetTask task);
        Task<bool> DeleteTask(Guid taskId);
        Task<TimesheetTask> GetTaskById(Guid taskId);
        Task<IEnumerable<TimesheetTask>> GetAllTasks();
}