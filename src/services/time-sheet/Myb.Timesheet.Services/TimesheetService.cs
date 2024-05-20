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
            await _timesheetRepository.InsertAsync(timesheet);
            return timesheet;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding new timesheet");
            throw;
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
}