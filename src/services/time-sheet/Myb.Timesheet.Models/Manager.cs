namespace Myb.Timesheet.Models;

public class Manager : Employee
{
    // Manager specific properties can go here. 
    // For now, Manager inherits everything from Employee.

    // You can add methods like ApproveTimeSheet and RejectTimeSheet here


    public void ApproveTimeSheet(TimeSheet timeSheet) { /*...*/ }
    public void RejectTimeSheet(TimeSheet timeSheet) { /*...*/ }
}