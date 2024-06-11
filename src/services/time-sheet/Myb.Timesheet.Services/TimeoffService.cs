using Microsoft.Extensions.Logging;
using Myb.Common.Repositories;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public class TimeoffService:ITimeoffService
{

    private readonly IGenericRepository<int?, TimeOff, TimesheetContext> _timeoffRepository;
    private readonly ILogger _logger;

    public TimeoffService(IGenericRepository<int?, TimeOff, TimesheetContext> timeoffRepository,ILogger<EmployeeService> logger)
    {
        _timeoffRepository = timeoffRepository;
        _logger = logger;
    }
    public Task<IEnumerable<TimeOff>> GetTimeOffsByEmployeeIdAsync(int employeeId)
    {
        try
        {
            var timeOffs = _timeoffRepository.GetAll().Where(t => t.EmployeeId == employeeId);
            return Task.FromResult(timeOffs.AsEnumerable());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting time offs by employee id: {EmployeeId}", employeeId);
            throw;
        }
    }


    public async Task<TimeOff> UpdateTimeOffAsync(TimeOff timeOff)
    {
        try
        {
            await _timeoffRepository.UpdateAsync(timeOff);
            return timeOff;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating time off");
            throw;
        }
    }
    public async Task<TimeOff> AddTimeOffAsync(TimeOff timeOff)
    {
        try
        {
            await _timeoffRepository.InsertAsync(timeOff);
            return timeOff;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating time off");
            throw;
        }
    }
}