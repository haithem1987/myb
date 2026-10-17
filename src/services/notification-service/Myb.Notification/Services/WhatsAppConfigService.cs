using Microsoft.EntityFrameworkCore;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public class WhatsAppConfigService : IWhatsAppConfigService
{
    private readonly IDbContextFactory<NotificationContext> _contextFactory;

    public WhatsAppConfigService(IDbContextFactory<NotificationContext> contextFactory)
        => _contextFactory = contextFactory;

    public async Task<CopropertyWhatsAppConfig?> GetAsync(string copropertyId)
    {
        using var ctx = _contextFactory.CreateDbContext();
        return await ctx.CopropertyWhatsAppConfigs.FindAsync(copropertyId);
    }

    public async Task UpsertAsync(CopropertyWhatsAppConfig config)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var existing = await ctx.CopropertyWhatsAppConfigs.FindAsync(config.CopropertyId);
        config.UpdatedAt = DateTime.UtcNow;
        if (existing is null)
            ctx.CopropertyWhatsAppConfigs.Add(config);
        else
        {
            existing.PhoneNumberId = config.PhoneNumberId;
            existing.AccessToken = config.AccessToken;
            existing.BusinessAccountId = config.BusinessAccountId;
            existing.ApiVersion = config.ApiVersion;
            existing.Enabled = config.Enabled;
            existing.UpdatedAt = config.UpdatedAt;
        }
        await ctx.SaveChangesAsync();
    }

    public async Task DeleteAsync(string copropertyId)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var config = await ctx.CopropertyWhatsAppConfigs.FindAsync(copropertyId);
        if (config is not null)
        {
            ctx.CopropertyWhatsAppConfigs.Remove(config);
            await ctx.SaveChangesAsync();
        }
    }
}
