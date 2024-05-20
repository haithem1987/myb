
using HotChocolate;
using Myb.Timesheet.Models;
using Myb.Timesheet.Services;

namespace Myb.Timesheet.Infra.GraphQl.Mutations
{
    public class TimesheetMutation
    {
        // Timesheet Mutations
        public async Task<TimeSheet> addTimesheet([Service] ITimesheetService timesheetService, TimeSheet timeSheet)
        {
            return await timesheetService.CreateTimeSheetAsync(timeSheet);
        }

        // Task mutations
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
        // Project Mutations
        public async Task<Project> AddProject([Service] IProjectService projectService, Project project)
        {
            return await projectService.AddProjectAsync(project);
        }

        public async Task<Project> UpdateProject([Service] IProjectService projectService, Project project)
        {
            return await projectService.UpdateProjectAsync(project);
        }

        public async Task<bool> DeleteProject([Service] IProjectService projectService, int id)
        {
            return await projectService.DeleteProjectAsync(id);
        }
        
        //Employee Mutation
        public async Task<Employee> AddEmployee([Service] IEmployeeService employeeService, Employee employee)
        {
            return await employeeService.AddEmployeeAsync(employee);
        }
        
       
    }
}
