using HotChocolate;
using HotChocolate.Resolvers;
using Myb.Timesheet.Models;
using Myb.Timesheet.Services;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Myb.Timesheet.Infra;

    public class TimesheetResolver
    {
        private readonly IEmployeeService _employeeService;
        private readonly IProjectService _projectService;
        private readonly ITimesheetService _timesheetService;

        public TimesheetResolver(IEmployeeService employeeService, IProjectService projectService,ITimesheetService timesheetService)
        {
            _employeeService = employeeService;
            _projectService = projectService;
            _timesheetService = timesheetService;
        }

        public async Task<Project?> GetProject(TimeSheet timesheet, IResolverContext context)
        {
            if (timesheet.ProjectId!=0)
            {
                return await _projectService.GetProjectByIdAsync(timesheet.ProjectId);
            }
            return null;
        }

        public async Task<IEnumerable<TimeSheet>> GetTimesheets(TimeSheet timesheet, IResolverContext context)
        {
            return await _timesheetService.GetTimeSheetsByUserIdAsync(timesheet.UserId);
        }
    }
