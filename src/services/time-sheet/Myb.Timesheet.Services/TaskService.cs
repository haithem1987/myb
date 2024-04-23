using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public class TaskService:ITaskService
{
    public Task<TimesheetTask> AddTask(TimesheetTask task)
    {
        throw new NotImplementedException();
    }

    public Task<TimesheetTask> UpdateTask(TimesheetTask task)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DeleteTask(Guid taskId)
    {
        throw new NotImplementedException();
    }

    public Task<TimesheetTask> GetTaskById(Guid taskId)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<TimesheetTask>> GetAllTasks()
    {
        throw new NotImplementedException();
    }
}