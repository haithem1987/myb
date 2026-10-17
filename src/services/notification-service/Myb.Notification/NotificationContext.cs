using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Myb.Notification;


public class NotificationContext : DbContext
{
    public DbSet<Models.Notification> Notifications { get; set; } = null!;
    public DbSet<Models.WebPushSubscription> PushSubscriptions { get; set; } = null!;
    public DbSet<Models.CommunicationLog> CommunicationLogs { get; set; } = null!;
    public DbSet<Models.CommunicationCampaign> Campaigns { get; set; } = null!;
    public DbSet<Models.CopropertyWhatsAppConfig> CopropertyWhatsAppConfigs { get; set; } = null!;

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

        var log = modelBuilder.Entity<Models.CommunicationLog>();
        log.HasKey(l => l.Id);
        log.HasIndex(l => new { l.CopropertyId, l.SentAt });
        log.HasIndex(l => new { l.RecipientId, l.SentAt });
        log.HasIndex(l => l.CampaignId).HasFilter("\"CampaignId\" IS NOT NULL");

        var campaign = modelBuilder.Entity<Models.CommunicationCampaign>();
        campaign.HasKey(c => c.Id);
        campaign.HasIndex(c => new { c.CopropertyId, c.CreatedAt });

        var waConfig = modelBuilder.Entity<Models.CopropertyWhatsAppConfig>();
        waConfig.HasKey(c => c.CopropertyId);
        waConfig.ToTable("CopropertyWhatsAppConfigs");
    }
}
