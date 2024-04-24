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
    
   /* protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (optionsBuilder.IsConfigured) return;
        
        var connectionString = _configuration.GetConnectionString("TimesheetDBConnection");
        optionsBuilder.UseNpgsql(connectionString);
        
    }*/

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TimeSheet>()
            .HasMany(ts => ts.TimeEntries)
            .WithOne(te => te.TimeSheet)
            .HasForeignKey(te => te.TimeSheetId);

        modelBuilder.Entity<TimesheetTask>(entity =>
        {
            entity.HasOne(d => d.Employee)
                .WithMany(p => p.Tasks)
                .HasForeignKey(d => d.EmployeeId)  
                .OnDelete(DeleteBehavior.Restrict); 

            entity.HasOne(d => d.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(d => d.ProjectId)   
                .OnDelete(DeleteBehavior.Restrict); 
        });
    }
}