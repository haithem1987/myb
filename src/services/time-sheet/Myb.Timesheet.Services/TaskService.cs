using Myb.Common.Repositories;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Models;
namespace Myb.Timesheet.Services
{
    public class TaskService : ITaskService
    {
        private readonly IGenericRepository<int,TimesheetTask, TimesheetContext> _taskRepository;

        public TaskService(IGenericRepository<int,TimesheetTask, TimesheetContext> taskRepository)
        {
            _taskRepository = taskRepository;
        }

        public Task<TimesheetTask> GetTaskByIdAsync(int id)
        {
            return  Task.FromResult(_taskRepository.GetById(id)!);
        }

        public async Task<IEnumerable<TimesheetTask>> GetAllTasksAsync()
        {
            return  _taskRepository.GetAll();
        }

        public async Task<TimesheetTask> AddTaskAsync(TimesheetTask task)
        {
            await _taskRepository.InsertAsync(task);
            return task;
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
    }
}