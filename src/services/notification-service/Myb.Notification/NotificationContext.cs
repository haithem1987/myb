using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Myb.Notification;


public class NotificationContext : DbContext
{
    public DbSet<Models.Notification> Notifications { get; set; } = null!;
    public DbSet<Models.WebPushSubscription> PushSubscriptions { get; set; } = null!;

    public NotificationContext(DbContextOptions<NotificationContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Models.Notification>().HasKey(n => n.Id);
        modelBuilder.Entity<Models.Notification>()
            .HasIndex(n => new { n.ReceiverId, n.CopropertyId, n.CreatedAt });

        var push = modelBuilder.Entity<Models.WebPushSubscription>();
        push.ToTable("PushSubscriptions");
        push.HasKey(s => s.Id);
        push.HasIndex(s => s.Endpoint).IsUnique();
        push.HasIndex(s => s.UserId);
    }
}
