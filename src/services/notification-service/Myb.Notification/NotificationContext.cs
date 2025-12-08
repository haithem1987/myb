using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Myb.Notification;


public class NotificationContext : DbContext
{
    public DbSet<Models.Notification> Notifications { get; set; } = null!;

    public NotificationContext(DbContextOptions<NotificationContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Models.Notification>().HasKey(n => n.Id);
    }
}
