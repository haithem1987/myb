namespace Myb.Timesheet.Models;

public class Manager : Employee
{

    public ICollection<Employee>? Employees { get; set; }
    
}