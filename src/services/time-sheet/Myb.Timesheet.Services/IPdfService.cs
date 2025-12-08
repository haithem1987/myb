using Myb.Timesheet.Models;

namespace Myb.Timesheet.Services;

public interface IPdfService
{
    byte[] GenerateTimesheetPdf(List<TimeSheet> timesheets);
}