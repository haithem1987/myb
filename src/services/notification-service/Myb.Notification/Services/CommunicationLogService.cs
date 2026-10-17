using Microsoft.EntityFrameworkCore;
using Myb.Notification.Dtos;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public class CommunicationLogService : ICommunicationLogService
{
    private readonly IDbContextFactory<NotificationContext> _contextFactory;

    public CommunicationLogService(IDbContextFactory<NotificationContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task<Guid> LogAsync(CommunicationLog entry)
    {
        using var ctx = _contextFactory.CreateDbContext();
        ctx.CommunicationLogs.Add(entry);
        await ctx.SaveChangesAsync();
        return entry.Id;
    }

    public async Task UpdateStatusAsync(Guid id, DeliveryStatus status, string? failureReason = null)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var log = await ctx.CommunicationLogs.FindAsync(id);
        if (log is null) return;
        log.Status = status;
        if (failureReason != null) log.FailureReason = failureReason;
        if (status == DeliveryStatus.Delivered) log.DeliveredAt = DateTimeOffset.UtcNow;
        if (status == DeliveryStatus.Read) log.ReadAt = DateTimeOffset.UtcNow;
        await ctx.SaveChangesAsync();
    }

    public async Task<PagedResult<CommunicationLogDto>> QueryLogsAsync(LogFilterDto filter)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var q = ctx.CommunicationLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.CopropertyId))
            q = q.Where(l => l.CopropertyId == filter.CopropertyId);
        if (!string.IsNullOrWhiteSpace(filter.RecipientId))
            q = q.Where(l => l.RecipientId == filter.RecipientId);
        if (!string.IsNullOrWhiteSpace(filter.Channel) &&
            Enum.TryParse<CommunicationChannel>(filter.Channel, true, out var ch))
            q = q.Where(l => l.Channel == ch);
        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            Enum.TryParse<DeliveryStatus>(filter.Status, true, out var st))
            q = q.Where(l => l.Status == st);
        if (filter.From.HasValue)
            q = q.Where(l => l.SentAt >= filter.From.Value);
        if (filter.To.HasValue)
            q = q.Where(l => l.SentAt <= filter.To.Value);
        if (filter.CampaignId.HasValue)
            q = q.Where(l => l.CampaignId == filter.CampaignId.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(l => l.SentAt)
            .Skip(filter.Page * filter.Size)
            .Take(filter.Size)
            .Select(l => CommunicationLogDto.From(l))
            .ToListAsync();

        return new PagedResult<CommunicationLogDto>(items, total, filter.Page, filter.Size);
    }

    public async Task<CommunicationLogDto?> GetLogAsync(Guid id)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var log = await ctx.CommunicationLogs.FindAsync(id);
        return log is null ? null : CommunicationLogDto.From(log);
    }

    public async Task<CommunicationStatsDto> GetStatsAsync(string? copropertyId)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var q = ctx.CommunicationLogs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(copropertyId))
            q = q.Where(l => l.CopropertyId == copropertyId);

        var total = await q.CountAsync();
        var byChannel = await q.GroupBy(l => l.Channel)
            .Select(g => new { Channel = g.Key, Count = g.Count() })
            .ToListAsync();
        var byStatus = await q.GroupBy(l => l.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        int ch(CommunicationChannel c) => byChannel.FirstOrDefault(x => x.Channel == c)?.Count ?? 0;
        int st(DeliveryStatus s) => byStatus.FirstOrDefault(x => x.Status == s)?.Count ?? 0;

        return new CommunicationStatsDto(
            total,
            new ChannelStats(ch(CommunicationChannel.InApp), ch(CommunicationChannel.Push), ch(CommunicationChannel.Email)),
            new StatusStats(st(DeliveryStatus.Sent), st(DeliveryStatus.Delivered), st(DeliveryStatus.Failed), st(DeliveryStatus.Read)));
    }
}
