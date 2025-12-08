using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public interface IEmployeeService
{
    Task<Employee> GetEmployeeByIdAsync(string id);
    Task<IEnumerable<Employee>> GetAllEmployeesAsync();
    Task<Employee> AddEmployeeAsync(Employee employee);
    Task<Employee> UpdateEmployeeAsync(Employee employee);
    Task<bool> DeleteEmployeeAsync(string id);
    Task<IQueryable<Employee>> GetEmployeesByManagerIdAsync(string managerId);
    Task<string?> GetManagerIdByUserIdAsync(string userId);


}