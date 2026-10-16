using Microsoft.EntityFrameworkCore;
using Myb.Notification.Dtos;
using Myb.Notification.Models;
using System.Text.Json;

namespace Myb.Notification.Services;

public class CampaignService : ICampaignService
{
    private readonly IDbContextFactory<NotificationContext> _contextFactory;
    private readonly INotificationService _notificationService;
    private readonly ICommunicationLogService _logService;

    public CampaignService(
        IDbContextFactory<NotificationContext> contextFactory,
        INotificationService notificationService,
        ICommunicationLogService logService)
    {
        _contextFactory = contextFactory;
        _notificationService = notificationService;
        _logService = logService;
    }

    public async Task<CampaignDto> CreateCampaignAsync(CreateCampaignRequest request, string createdBy)
    {
        if (request.RecipientIds.Length == 0)
            throw new ArgumentException("At least one recipient is required.");

        var campaign = new CommunicationCampaign
        {
            Name = request.Name,
            Description = request.Description,
            CopropertyId = request.CopropertyId,
            CreatedBy = createdBy,
            Status = CampaignStatus.Draft,
            ChannelsJson = JsonSerializer.Serialize(request.Channels),
            RecipientIdsJson = JsonSerializer.Serialize(request.RecipientIds),
            Message = request.Message,
            Subject = request.Subject,
            TotalRecipients = request.RecipientIds.Length,
        };

        using var ctx = _contextFactory.CreateDbContext();
        ctx.Campaigns.Add(campaign);
        await ctx.SaveChangesAsync();
        return ToDto(campaign);
    }

    public async Task<PagedResult<CampaignDto>> GetCampaignsAsync(CampaignFilterDto filter)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var q = ctx.Campaigns.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.CopropertyId))
            q = q.Where(c => c.CopropertyId == filter.CopropertyId);
        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            Enum.TryParse<CampaignStatus>(filter.Status, true, out var st))
            q = q.Where(c => c.Status == st);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(c => c.CreatedAt)
            .Skip(filter.Page * filter.Size)
            .Take(filter.Size)
            .ToListAsync();

        return new PagedResult<CampaignDto>(items.Select(ToDto).ToList(), total, filter.Page, filter.Size);
    }

    public async Task<CampaignDto?> GetCampaignAsync(Guid id)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var c = await ctx.Campaigns.FindAsync(id);
        return c is null ? null : ToDto(c);
    }

    public async Task StartCampaignAsync(Guid id)
    {
        string[] recipients;
        string[] channels;
        CommunicationCampaign campaign;

        using (var ctx = _contextFactory.CreateDbContext())
        {
            campaign = await ctx.Campaigns.FindAsync(id)
                ?? throw new InvalidOperationException("Campaign not found.");
            if (campaign.Status is not (CampaignStatus.Draft or CampaignStatus.Scheduled))
                throw new InvalidOperationException($"Cannot start a campaign in status {campaign.Status}.");

            campaign.Status = CampaignStatus.Running;
            campaign.StartedAt = DateTimeOffset.UtcNow;
            await ctx.SaveChangesAsync();

            recipients = JsonSerializer.Deserialize<string[]>(campaign.RecipientIdsJson) ?? [];
            channels = JsonSerializer.Deserialize<string[]>(campaign.ChannelsJson) ?? [];
        }

        int sent = 0, failed = 0;

        foreach (var recipientId in recipients)
        {
            foreach (var channel in channels)
            {
                var parsedChannel = Enum.TryParse<CommunicationChannel>(channel, true, out var ch)
                    ? ch : CommunicationChannel.InApp;

                DeliveryStatus deliveryStatus;
                try
                {
                    if (parsedChannel == CommunicationChannel.InApp)
                        await _notificationService.SendNotificationAsync(
                            campaign.CreatedBy, recipientId, campaign.Message,
                            campaign.CopropertyId, push: false);

                    deliveryStatus = DeliveryStatus.Sent;
                    sent++;
                }
                catch
                {
                    deliveryStatus = DeliveryStatus.Failed;
                    failed++;
                }

                await _logService.LogAsync(new CommunicationLog
                {
                    SenderId = campaign.CreatedBy,
                    SenderType = "user",
                    RecipientId = recipientId,
                    CopropertyId = campaign.CopropertyId,
                    Channel = parsedChannel,
                    Subject = campaign.Subject ?? campaign.Name,
                    Body = campaign.Message,
                    Status = deliveryStatus,
                    EventType = "campaign",
                    CampaignId = campaign.Id,
                });
            }
        }

        using (var ctx = _contextFactory.CreateDbContext())
        {
            var c = await ctx.Campaigns.FindAsync(id);
            if (c is null) return;
            c.Status = CampaignStatus.Completed;
            c.CompletedAt = DateTimeOffset.UtcNow;
            c.SentCount = sent;
            c.FailedCount = failed;
            await ctx.SaveChangesAsync();
        }
    }

    public async Task CancelCampaignAsync(Guid id)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var c = await ctx.Campaigns.FindAsync(id)
            ?? throw new InvalidOperationException("Campaign not found.");
        if (c.Status is CampaignStatus.Completed or CampaignStatus.Cancelled)
            throw new InvalidOperationException($"Cannot cancel a campaign in status {c.Status}.");
        c.Status = CampaignStatus.Cancelled;
        await ctx.SaveChangesAsync();
    }

    public Task<PagedResult<CommunicationLogDto>> GetCampaignLogsAsync(Guid campaignId, int page, int size)
        => _logService.QueryLogsAsync(new LogFilterDto(CampaignId: campaignId, Page: page, Size: size));

    private static CampaignDto ToDto(CommunicationCampaign c) => new(
        c.Id, c.Name, c.Description, c.CopropertyId, c.CreatedBy,
        c.Status.ToString(),
        JsonSerializer.Deserialize<string[]>(c.ChannelsJson) ?? [],
        c.TotalRecipients, c.SentCount, c.FailedCount,
        c.ScheduledAt, c.StartedAt, c.CompletedAt, c.CreatedAt);
}
