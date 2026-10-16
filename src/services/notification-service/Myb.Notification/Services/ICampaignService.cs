using Myb.Notification.Dtos;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public interface ICampaignService
{
    Task<CampaignDto> CreateCampaignAsync(CreateCampaignRequest request, string createdBy);
    Task<PagedResult<CampaignDto>> GetCampaignsAsync(CampaignFilterDto filter);
    Task<CampaignDto?> GetCampaignAsync(Guid id);
    Task StartCampaignAsync(Guid id);
    Task CancelCampaignAsync(Guid id);
    Task<PagedResult<CommunicationLogDto>> GetCampaignLogsAsync(Guid campaignId, int page, int size);
}
