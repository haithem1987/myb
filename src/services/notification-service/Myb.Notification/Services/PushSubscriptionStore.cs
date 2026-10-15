using Microsoft.EntityFrameworkCore;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public interface IPushSubscriptionStore
{
    Task UpsertAsync(string userId, string endpoint, string p256dh, string auth, string? userAgent);
    Task<bool> RemoveAsync(string userId, string endpoint);
    Task<List<WebPushSubscription>> GetByUserAsync(string userId);
    Task MarkSuccessAsync(string subscriptionId);
    /// <summary>Returns true when the subscription was dropped after too many failures.</summary>
    Task<bool> MarkFailureAsync(string subscriptionId, int maxConsecutiveFailures);
    Task DeleteAsync(string subscriptionId);
}

public class PushSubscriptionStore : IPushSubscriptionStore
{
    private readonly IDbContextFactory<NotificationContext> _contextFactory;

    public PushSubscriptionStore(IDbContextFactory<NotificationContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task UpsertAsync(string userId, string endpoint, string p256dh, string auth, string? userAgent)
    {
        using var context = _contextFactory.CreateDbContext();
        var existing = await context.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == endpoint);
        if (existing == null)
        {
            context.PushSubscriptions.Add(new WebPushSubscription
            {
                UserId = userId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = auth,
                UserAgent = userAgent
            });
        }
        else
        {
            // A browser endpoint belongs to whoever is signed in on it now, so a shared
            // device stops receiving the previous account's notifications.
            existing.UserId = userId;
            existing.P256dh = p256dh;
            existing.Auth = auth;
            existing.UserAgent = userAgent;
            existing.FailureCount = 0;
        }
        await context.SaveChangesAsync();
    }

    public async Task<bool> RemoveAsync(string userId, string endpoint)
    {
        using var context = _contextFactory.CreateDbContext();
        var existing = await context.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint && s.UserId == userId);
        if (existing == null) return false;
        context.PushSubscriptions.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<List<WebPushSubscription>> GetByUserAsync(string userId)
    {
        using var context = _contextFactory.CreateDbContext();
        return await context.PushSubscriptions.AsNoTracking()
            .Where(s => s.UserId == userId)
            .ToListAsync();
    }

    public async Task MarkSuccessAsync(string subscriptionId)
    {
        using var context = _contextFactory.CreateDbContext();
        var subscription = await context.PushSubscriptions.FindAsync(subscriptionId);
        if (subscription == null) return;
        subscription.FailureCount = 0;
        subscription.LastSuccessAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
    }

    public async Task<bool> MarkFailureAsync(string subscriptionId, int maxConsecutiveFailures)
    {
        using var context = _contextFactory.CreateDbContext();
        var subscription = await context.PushSubscriptions.FindAsync(subscriptionId);
        if (subscription == null) return true;
        subscription.FailureCount++;
        var drop = subscription.FailureCount >= maxConsecutiveFailures;
        if (drop) context.PushSubscriptions.Remove(subscription);
        await context.SaveChangesAsync();
        return drop;
    }

    public async Task DeleteAsync(string subscriptionId)
    {
        using var context = _contextFactory.CreateDbContext();
        var subscription = await context.PushSubscriptions.FindAsync(subscriptionId);
        if (subscription == null) return;
        context.PushSubscriptions.Remove(subscription);
        await context.SaveChangesAsync();
    }
}
