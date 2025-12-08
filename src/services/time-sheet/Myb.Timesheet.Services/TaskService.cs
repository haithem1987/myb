using Microsoft.Extensions.Logging;
using Myb.Common.Repositories;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Models;
namespace Myb.Timesheet.Services
{
    public class TaskService : ITaskService
    {
        private readonly IGenericRepository<int?,TimesheetTask, TimesheetContext> _taskRepository;
        private readonly ILogger _logger;
        public TaskService(IGenericRepository<int?,TimesheetTask, TimesheetContext> taskRepository, ILogger<ProjectService> logger)
        {
            _taskRepository = taskRepository;
            _logger = logger;
        }

        public Task<TimesheetTask> GetTaskByIdAsync(int id)
        {
            return  Task.FromResult(_taskRepository.GetById(id)!);
        }

        public Task<IEnumerable<TimesheetTask>> GetAllTasksAsync()
        {
            return Task.FromResult<IEnumerable<TimesheetTask>>(_taskRepository.GetAll());
        }

        public async Task<TimesheetTask> AddTaskAsync(TimesheetTask task)
        {
            try
            {
                await _taskRepository.InsertAsync(task);
                return task;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding new project");
                throw;
            }
        }

        public async Task<TimesheetTask> UpdateTaskAsync(TimesheetTask task)
        {
            await _taskRepository.UpdateAsync(task);
            return task;
        }

        public async Task<bool> DeleteTaskAsync(int id)
        {
            await _taskRepository.DeleteAsync(id);
            return true;
        }
        
        public Task<IEnumerable<TimesheetTask>> GetTasksByProjectIdAsync(int projectId)
        {
            var tasks = _taskRepository.GetAll().Where(t => t.ProjectId == projectId);
            return Task.FromResult<IEnumerable<TimesheetTask>>(tasks);
        }
    }
}