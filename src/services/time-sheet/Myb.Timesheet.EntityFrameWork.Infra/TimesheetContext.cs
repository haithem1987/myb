using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Myb.Timesheet.Models;
namespace Myb.Timesheet.EntityFrameWork.Infra;

public class TimesheetContext:DbContext
{
    private readonly IConfiguration _configuration;
    public TimesheetContext()
    {
        
    }

    public TimesheetContext(DbContextOptions<TimesheetContext> options, IConfiguration configuration)
        : base(options)
    {
        _configuration = configuration;
    }
    
    public DbSet<Project> Projects { get; set; }
    public DbSet<TimesheetTask> Tasks { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<TimeOff> TimeOffs { get; set; }
    public DbSet<TimeSheet> TimeSheets { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            var connectionString = _configuration.GetConnectionString("TimesheetDBConnection");
            optionsBuilder.UseNpgsql(connectionString);
        }
    }

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