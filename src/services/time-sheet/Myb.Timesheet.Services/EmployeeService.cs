using Microsoft.Extensions.Logging;
using Myb.Common.Repositories;
using Myb.Timesheet.EntityFrameWork.Infra;
using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public class EmployeeService:IEmployeeService
{
    private readonly IGenericRepository<string?, Employee, TimesheetContext> _employeeRepository;
    private readonly IGenericRepository<int?, TimeOff, TimesheetContext> _timeoffRepository;
    private readonly ILogger _logger;

    public EmployeeService(IGenericRepository<string?, Employee, TimesheetContext> employeeRepository, IGenericRepository<int?, TimeOff, TimesheetContext> timeoffRepository,ILogger<EmployeeService> logger)
    {
        _employeeRepository = employeeRepository;
        _timeoffRepository = timeoffRepository;
        _logger = logger;
    }
    
    public Task<Employee> GetEmployeeByIdAsync(string id)
    {
        try
        {
            return  Task.FromResult(_employeeRepository.GetById(id)!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employee by id: {EmployeeId}", id);
            throw;
        }
    }
    public Task<IEnumerable<Employee>> GetAllEmployeesAsync()
    {
        try
        {
            return Task.FromResult<IEnumerable<Employee>>(_employeeRepository.GetAll());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all employees");
            throw;
        }
    }
    
    public async  Task<Employee> AddEmployeeAsync(Employee employee)
    {
        try
        {
            await _employeeRepository.InsertAsync(employee);
            return employee;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding new employee");
            throw;
        }
    }
    public async Task<Employee> UpdateEmployeeAsync(Employee employee)
    {
        try
        {
            await _employeeRepository.UpdateAsync(employee);
            return employee;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating employee");
            throw;
        }
    }
    public async Task<bool> DeleteEmployeeAsync(string id)
    {
        try
        {
            await _employeeRepository.DeleteAsync(id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting employee with id: {EmployeeId}", id);
            throw;
        }
    }
    
    public Task<IQueryable<Employee>> GetEmployeesByManagerIdAsync(string managerId)
    {
        try
        {
            var employees = _employeeRepository.GetAll().Where(e => e.ManagerId == managerId);
            return Task.FromResult(employees);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employees by managerId: {ManagerId}", managerId);
            throw;
        }
    }

}