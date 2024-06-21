using Microsoft.Extensions.Logging;
using Myb.Common.Repositories;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public class ProjectService:IProjectService
{
    private readonly IGenericRepository<int?, Project, TimesheetContext> _projectRepository;
    private readonly ILogger _logger;

    public ProjectService(IGenericRepository<int?, Project, TimesheetContext> projectRepository, ILogger<ProjectService> logger)
    {
        _projectRepository = projectRepository;
        _logger = logger;
    }
    
    public Task<Project> GetProjectByIdAsync(int id)
    {
        try
        {
            return  Task.FromResult(_projectRepository.GetById(id)!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project by id: {ProjectId}", id);
            throw;
        }
    }
    public Task<IEnumerable<Project>> GetAllProjectsAsync()
    {
        try
        {
            return Task.FromResult<IEnumerable<Project>>(_projectRepository.GetAll());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all projects");
            throw;
        }
    }
    
    public async  Task<Project> AddProjectAsync(Project project)
    {
        try
        {
            await _projectRepository.UpdateAsync(project);
            return project;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding new project");
            throw;
        }
    }
    public async Task<Project> UpdateProjectAsync(Project project)
    {
        try
        {
            await _projectRepository.UpdateAsync(project);
            return project;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project");
            throw;
        }
    }
    public async Task<bool> DeleteProjectAsync(int id)
    {
        try
        {
            await _projectRepository.DeleteAsync(id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project with id: {ProjectId}", id);
            throw;
        }
    }
    
    public async Task<bool> SoftDeleteProjectAsync(int id)
    {
        try
        {
            var project =  _projectRepository.GetById(id);
            if (project == null)
            {
                _logger.LogWarning("Project with id {ProjectId} not found", id);
                return false;
            }

            project.Status = ProjectStatus.Deleted;
            await _projectRepository.UpdateAsync(project);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting project with id: {ProjectId}", id);
            throw;
        }
    }

    public async Task<bool> UpdateProjectStatusAsync(int id, ProjectStatus status)
    {
        try
        {
            var project =  _projectRepository.GetById(id);
            if (project == null)
            {
                _logger.LogWarning("Project with id {ProjectId} not found", id);
                return false;
            }

            project.Status = status;
            await _projectRepository.UpdateAsync(project);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project status with id: {ProjectId}", id);
            throw;
        }
    }
    public async Task<IEnumerable<Project>> GetActiveProjectsAsync()
    {
        try
        {
            var projects = _projectRepository.GetAll().Where(p => p.Status == ProjectStatus.Active);
            return await Task.FromResult(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active projects");
            throw;
        }
    }

    public async Task<IEnumerable<Project>> GetArchivedProjectsAsync()
    {
        try
        {
            var projects = _projectRepository.GetAll().Where(p => p.Status == ProjectStatus.Archived);
            return await Task.FromResult(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting archived projects");
            throw;
        }
    }
}