using Microsoft.Extensions.Logging;
using Myb.Common.Repositories;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public class TimesheetService:ITimesheetService
{
    private readonly IGenericRepository<int?, TimeSheet, TimesheetContext> _timesheetRepository;
    private readonly ILogger _logger;

    public TimesheetService(IGenericRepository<int?, TimeSheet, TimesheetContext> timesheetRepository,ILogger<TimesheetService> logger)
    {
        _timesheetRepository = timesheetRepository;
        _logger = logger;
    }
    
    public async Task<TimeSheet> CreateTimeSheetAsync(TimeSheet timesheet)
    {
        try
        {
            // Attempt to insert the new timesheet
            var result = await _timesheetRepository.InsertAsync(timesheet);

            // Check if the insertion was successful
            if (result.Entity == null)
            {
                _logger.LogError("Failed to create timesheet: {Errors}", string.Join(", ", result.Errors));
                throw new Exception("Failed to create timesheet: " + string.Join(", ", result.Errors));
            }

            return result.Entity;
        }
        catch (ArgumentNullException argEx)
        {
            // Handle argument null exceptions specifically
            _logger.LogError(argEx, "Argument null error while adding new timesheet: {Message}", argEx.Message);
            throw new Exception("Required information is missing for adding a new timesheet. Please ensure all fields are filled correctly.");
        }
        catch (Exception ex)
        {
            // General exception handling
            _logger.LogError(ex, "Unexpected error while adding new timesheet: {Message}", ex.Message);
            throw new Exception("An unexpected error occurred while adding the new timesheet. Please try again or contact support if the problem persists.");
        }
    }


    public Task<TimeSheet> GetTimeSheetAsync(int timesheetId)
    {
        try
        {
            return  Task.FromResult(_timesheetRepository.GetById(timesheetId)!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting timesheet by id: {timesheetId}", timesheetId);
            throw;
        }
    }

    public Task<IEnumerable<TimeSheet>> GetAllTimeSheetsAsync()
    {
        try
        {
            return Task.FromResult<IEnumerable<TimeSheet>>(_timesheetRepository.GetAll());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all timesheets");
            throw;
        }
    }

    public async Task<TimeSheet> UpdateTimeSheetAsync(TimeSheet timesheet)
    {
        try
        {
            await _timesheetRepository.UpdateAsync(timesheet);
            return timesheet;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project");
            throw;
        };
    }

    public async Task<bool>  DeleteTimeSheetAsync(int timesheetId)
    {
        try
        {
            await _timesheetRepository.DeleteAsync(timesheetId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting timesheet with id: {timesheetId}", timesheetId);
            throw;
        }
    }

    public Task ApproveTimeSheetAsync(int timesheetId)
    {
        throw new NotImplementedException();
    }

    public Task RejectTimeSheetAsync(int timesheetId, string reason)
    {
        throw new NotImplementedException();
    }
    public Task<IEnumerable<TimeSheet>> GetTimeSheetsByUserIdAsync(string userId)
    {
        try
        {
            var timesheets = _timesheetRepository.GetAll().Where(t => t.UserId == userId);
            return Task.FromResult<IEnumerable<TimeSheet>>(timesheets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting timesheets by user id: {userId}", userId);
            throw;
        }
    }
    public Task<IEnumerable<TimeSheet>> GetTimeSheetsByEmployeeIdAsync(int employeeId)
    {
        try
        {
            var timesheets = _timesheetRepository.GetAll().Where(t => t.EmployeeId == employeeId);
            return Task.FromResult<IEnumerable<TimeSheet>>(timesheets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting timesheets by employee id: {employeeId}", employeeId);
            throw;
        }
    }
 public async Task<List<TimeSheet>> UpdateMultipleTimesheetsAsync(List<TimeSheet> timesheets)
{
    var updatedTimesheets = new List<TimeSheet>();

    try
    {
        foreach (var timesheet in timesheets)
        {
            if (timesheet.Id == 0)
            {
                var newTimesheet = timesheet;
                newTimesheet.Id = null;
                
                // New timesheet, create it
                var createdTimesheetResult = await _timesheetRepository.InsertAsync(newTimesheet);
                if (createdTimesheetResult.Entity != null)
                {
                    updatedTimesheets.Add(createdTimesheetResult.Entity);
                }
                else
                {
                    _logger.LogError("Error creating timesheet: {Errors}", string.Join(", ", createdTimesheetResult.Errors));
                    throw new Exception("Error creating timesheet: " + string.Join(", ", createdTimesheetResult.Errors));
                }
            }
            else
            {
                // Existing timesheet, update it
                var updateResult = await _timesheetRepository.UpdateAsync(timesheet);
                if (updateResult.Entity != null)
                {
                    updatedTimesheets.Add(updateResult.Entity);
                }
                else
                {
                    _logger.LogError("Error updating timesheet: {Errors}", string.Join(", ", updateResult.Errors));
                    throw new Exception("Error updating timesheet: " + string.Join(", ", updateResult.Errors));
                }
            }
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating multiple timesheets");
        throw;
    }

    return updatedTimesheets;
}


}