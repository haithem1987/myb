using HotChocolate;
using HotChocolate.Types;
using Myb.Timesheet.Models;
using Myb.Timesheet.Services;

namespace Myb.Timesheet.Infra.GraphQl.Querys
{
    public class TimesheetQuery
    {
        // Task queries
        public async Task<TimesheetTask> GetTaskById([Service] ITaskService taskService, int id)
        {
            return await taskService.GetTaskByIdAsync(id);
        }

        public async Task<IEnumerable<TimesheetTask>> GetAllTasks([Service] ITaskService taskService)
        {
            return await taskService.GetAllTasksAsync();
        }
        public async Task<IEnumerable<TimesheetTask>> GetTasksByProjectId([Service] ITaskService taskService, int projectId)
        {
            return await taskService.GetTasksByProjectIdAsync(projectId);
        }
        // Project queries
        public async Task<Project> GetProjectById([Service] IProjectService projectService, int id)
        {
            return await projectService.GetProjectByIdAsync(id);
        }

        public async Task<IEnumerable<Project>> GetAllProjects([Service] IProjectService projectService)
        {
            return await projectService.GetAllProjectsAsync();
        }
        
        public async Task<IEnumerable<Employee>> GetAllEmployees([Service] IEmployeeService employeeService)
        {
            return await employeeService.GetAllEmployeesAsync();
        }

        public async Task<IEnumerable<TimeSheet>> GetAllTimesheets([Service] ITimesheetService timesheetService)
        {
            return await timesheetService.GetAllTimeSheetsAsync();
        }
//Timesheet queries        
        public async Task<IEnumerable<TimeSheet>> GetTimesheetsByUserId([Service] ITimesheetService timesheetService, string userId)
        {
            return await timesheetService.GetTimeSheetsByUserIdAsync(userId);
        }
    }
}
