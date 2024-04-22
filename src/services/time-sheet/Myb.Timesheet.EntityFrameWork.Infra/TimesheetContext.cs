using Microsoft.EntityFrameworkCore;
using Myb.Timesheet.Models;

namespace Myb.Timesheet.EntityFrameWork.Infra;

public class TimesheetContext:DbContext
{
    public TimesheetContext()
    {
        
    }
    public TimesheetContext(DbContextOptions<TimesheetContext> options)
        : base(options)
    {
    }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Task> Tasks { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<TimeOff> TimeOffs { get; set; }
    public DbSet<TimeSheet> TimeSheets { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TimeSheet>()
            .HasMany(ts => ts.TimeEntries)
            .WithOne(te => te.TimeSheet)
            .HasForeignKey(te => te.TimeSheetId);

        modelBuilder.Entity<TimesheetTask>()
            .HasOne(t => t.Employee)
            .WithMany(e => e.Tasks)
            .HasForeignKey(t => t.EmployeeId);

        modelBuilder.Entity<TimesheetTask>()
            .HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId);
    }
}