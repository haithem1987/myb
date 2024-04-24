
using HotChocolate;
using Myb.Timesheet.Models;
using Myb.Timesheet.Services;

namespace Myb.Timesheet.Infra.GraphQl.Mutations
{
    public class TaskMutation
    {
        public async Task<TimesheetTask> AddTask([Service] ITaskService taskService, TimesheetTask task)
        {
            return await taskService.AddTaskAsync(task);
        }

        public async Task<TimesheetTask> UpdateTask([Service] ITaskService taskService, TimesheetTask task)
        {
            return await taskService.UpdateTaskAsync(task);
        }

        public async Task<bool> DeleteTask([Service] ITaskService taskService, int id)
        {
            return await taskService.DeleteTaskAsync(id);
        }
    }
}
