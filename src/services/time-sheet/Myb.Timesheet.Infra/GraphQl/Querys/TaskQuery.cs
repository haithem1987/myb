using HotChocolate;
using Myb.Timesheet.Models;
using Myb.Timesheet.Services;

namespace Myb.Timesheet.Infra.GraphQl.Querys
{
    public class TaskQuery
    {

        public async Task<TimesheetTask> GetTaskById([Service] ITaskService taskService, int id)
        {
            return await taskService.GetTaskByIdAsync(id);
        }

        public async Task<IEnumerable<TimesheetTask>> GetAllTasks([Service] ITaskService taskService)
        {
            return await taskService.GetAllTasksAsync();
        }
    }
}
