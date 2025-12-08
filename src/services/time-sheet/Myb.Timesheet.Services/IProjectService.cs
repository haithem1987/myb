using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public interface IProjectService
{
    Task<Project> GetProjectByIdAsync(int id);
    Task<IEnumerable<Project>> GetAllProjectsAsync();
    Task<Project> AddProjectAsync(Project project);
    Task<Project> UpdateProjectAsync(Project project);
    Task<bool> DeleteProjectAsync(int id);
    Task<bool> SoftDeleteProjectAsync(int id);
    Task<bool> UpdateProjectStatusAsync(int id, ProjectStatus status);
    Task<IEnumerable<Project>> GetActiveProjectsAsync();
    Task<IEnumerable<Project>> GetArchivedProjectsAsync();
}