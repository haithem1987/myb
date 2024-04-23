
using HotChocolate;
using Myb.Timesheet.Models;
using Myb.Timesheet.Services;

namespace Myb.Timesheet.Infra.GraphQl.Mutations
{
    public class TaskMutation
    {
        public Task<TimesheetTask?> AddTask([Service] ITaskService taskService,TimesheetTask task) => taskService.AddTaskAsync(task);
    }
}
