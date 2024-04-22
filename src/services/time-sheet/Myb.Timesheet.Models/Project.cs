namespace Myb.Timesheet.Models;

public class Project
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; }
    public string Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Assuming a Project has multiple Tasks
    public virtual ICollection<TimesheetTask> Tasks { get; set; }
    
    public void AddProject(Project project)
    {
        // Add project logic here
    }

    public void UpdateProjectDetails(string projectName, string description, DateTime startDate, DateTime endDate)
    {
        // Update project details logic here
    }
}