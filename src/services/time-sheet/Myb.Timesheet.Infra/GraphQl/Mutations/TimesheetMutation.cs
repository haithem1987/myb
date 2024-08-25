using HotChocolate;
using Myb.Timesheet.Models;
using Myb.Timesheet.Services;
using System.Threading.Tasks;

namespace Myb.Timesheet.Infra.GraphQl.Mutations
{
    public class TimesheetMutation
    {
        // Timesheet Mutations
        public async Task<TimeSheet> addTimesheet([Service] ITimesheetService timesheetService, TimeSheet timeSheet)
        {
            return await timesheetService.CreateTimeSheetAsync(timeSheet);
        }
        
        public async Task<TimeSheet> updateTimesheet([Service] ITimesheetService timesheetService, TimeSheet timeSheet)
        {
            return await timesheetService.UpdateTimeSheetAsync(timeSheet);
        }
        
        public async Task<List<TimeSheet>> UpdateMultipleTimesheets([Service] ITimesheetService timesheetService, List<TimeSheet> timesheets)
        {
            return await timesheetService.UpdateMultipleTimesheetsAsync(timesheets);
        }

        public async Task<bool> DeleteTimesheet([Service] ITimesheetService timesheetService, int id)
        {
            return await timesheetService.DeleteTimeSheetAsync(id);
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

        // Employee Mutation
        public async Task<Employee> AddEmployee([Service] IEmployeeService employeeService, Employee employee)
        {
            return await employeeService.AddEmployeeAsync(employee);
        }

        public async Task<Employee> UpdateEmployee([Service] IEmployeeService employeeService, Employee employee)
        {
            return await employeeService.UpdateEmployeeAsync(employee);
        }
        
        public async Task<bool> DeleteEmployee([Service] IEmployeeService employeeService, string id)
        {
            return  await employeeService.DeleteEmployeeAsync(id);
        }
        
        // TimeOff mutations
        public async Task<TimeOff> UpdateTimeOff([Service] ITimeoffService timeoffService, TimeOff timeOff)
        {
            return await timeoffService.UpdateTimeOffAsync(timeOff);
        }
        
        public async Task<TimeOff> AddTimeOff([Service] ITimeoffService timeoffService, TimeOff timeOff)
        {
            return await timeoffService.AddTimeOffAsync(timeOff);
        }
        
        // Generate Timesheet PDF
        public async Task<string> GenerateTimesheetPdf([Service] IPdfService pdfService, [Service] ITimesheetService timesheetService, List<int> projectIds)
        {
            var timesheets = await timesheetService.GetTimesheetsByProjectIds(projectIds);
            var pdfBytes = pdfService.GenerateTimesheetPdf(timesheets);
            return Convert.ToBase64String(pdfBytes);
        }
    }
}
