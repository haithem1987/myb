using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public class WhatsAppConfigService : IWhatsAppConfigService
{
    private const string ProtectorPurpose = "WhatsAppAccessToken.v1";

    private readonly IDbContextFactory<NotificationContext> _contextFactory;
    private readonly IDataProtector _protector;

    public WhatsAppConfigService(
        IDbContextFactory<NotificationContext> contextFactory,
        IDataProtectionProvider dataProtection)
    {
        _contextFactory = contextFactory;
        _protector = dataProtection.CreateProtector(ProtectorPurpose);
    }

    public async Task<CopropertyWhatsAppConfig?> GetAsync(string copropertyId)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var row = await ctx.CopropertyWhatsAppConfigs.FindAsync(copropertyId);
        if (row is null) return null;

        // Return a detached copy with the token decrypted — never expose ciphertext to callers
        return new CopropertyWhatsAppConfig
        {
            CopropertyId      = row.CopropertyId,
            PhoneNumberId     = row.PhoneNumberId,
            AccessToken       = TryDecrypt(row.AccessToken),
            BusinessAccountId = row.BusinessAccountId,
            ApiVersion        = row.ApiVersion,
            Enabled           = row.Enabled,
            UpdatedAt         = row.UpdatedAt,
        };
    }

    public async Task UpsertAsync(CopropertyWhatsAppConfig config)
    {
        using var ctx = _contextFactory.CreateDbContext();
        var existing = await ctx.CopropertyWhatsAppConfigs.FindAsync(config.CopropertyId);
        var now = DateTime.UtcNow;

        // Encrypt before persisting; keep existing token when the caller passes empty string
        var ciphertext = string.IsNullOrWhiteSpace(config.AccessToken)
            ? existing?.AccessToken ?? ""
            : _protector.Protect(config.AccessToken);

        if (existing is null)
        {
            ctx.CopropertyWhatsAppConfigs.Add(new CopropertyWhatsAppConfig
            {
                CopropertyId      = config.CopropertyId,
                PhoneNumberId     = config.PhoneNumberId,
                AccessToken       = ciphertext,
                BusinessAccountId = config.BusinessAccountId,
                ApiVersion        = config.ApiVersion,
                Enabled           = config.Enabled,
                UpdatedAt         = now,
            });
        }
        else
        {
            existing.PhoneNumberId     = config.PhoneNumberId;
            existing.AccessToken       = ciphertext;
            existing.BusinessAccountId = config.BusinessAccountId;
            existing.ApiVersion        = config.ApiVersion;
            existing.Enabled           = config.Enabled;
            existing.UpdatedAt         = now;
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

    private string TryDecrypt(string ciphertext)
    {
        if (string.IsNullOrWhiteSpace(ciphertext)) return "";
        try { return _protector.Unprotect(ciphertext); }
        catch { return ""; /* key rotation / corrupted entry — treat as missing */ }
    }
}
