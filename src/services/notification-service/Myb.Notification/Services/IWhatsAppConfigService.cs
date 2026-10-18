using Myb.Notification.Models;

namespace Myb.Notification.Services;

public interface IWhatsAppConfigService
{
    Task<CopropertyWhatsAppConfig?> GetAsync(string copropertyId);
    Task UpsertAsync(CopropertyWhatsAppConfig config);
    Task DeleteAsync(string copropertyId);
}
