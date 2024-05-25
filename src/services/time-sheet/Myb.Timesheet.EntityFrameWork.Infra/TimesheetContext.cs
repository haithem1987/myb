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
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Manager> Managers { get; set; }
    public DbSet<TimesheetTask> Tasks { get; set; }
    public DbSet<TimeSheet> Timesheets { get; set; }
    
   protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (optionsBuilder.IsConfigured) return;
        
        var connectionString = _configuration.GetConnectionString("TimesheetDBConnection");
        optionsBuilder.UseNpgsql(connectionString);
        
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Employee>()
            .ToTable("Employees");

        modelBuilder.Entity<Manager>()
            .ToTable("Managers");
        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Manager)  // One manager
            .WithMany(m => m.Employees)  // Many employees
            .HasForeignKey(e => e.ManagerId); 
        
        modelBuilder.Entity<TimeSheet>(entity =>
        {
            entity.HasKey(ts => ts.Id);
            entity.HasOne(ts => ts.Employee)
                .WithMany(te => te.Timesheets)
                .HasForeignKey(te => te.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ts => ts.Project)
                .WithMany(te => te.Timesheets)
                .HasForeignKey(te => te.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
            
          
        modelBuilder.Entity<TimeOff>(entity =>
        {
            entity.HasKey(to => to.Id);

            entity.HasOne(to => to.Employee)
                .WithMany(e => e.TimeOffs) 
                .HasForeignKey(to => to.EmployeeId) 
                .OnDelete(DeleteBehavior.Cascade); 
        });
        modelBuilder.Entity<TimesheetTask>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.HasOne(d => d.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(d => d.ProjectId)   
                .OnDelete(DeleteBehavior.Restrict); 
            entity.HasOne(d => d.Employee)
                .WithMany(p => p.Tasks)
                .HasForeignKey(d => d.EmployeeId)   
                .OnDelete(DeleteBehavior.Restrict); 
            
        });
        
     
    }
}