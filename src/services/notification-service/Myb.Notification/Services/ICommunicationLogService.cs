using Myb.Notification.Dtos;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public interface ICommunicationLogService
{
    Task<Guid> LogAsync(CommunicationLog entry);
    Task UpdateStatusAsync(Guid id, DeliveryStatus status, string? failureReason = null);
    Task<PagedResult<CommunicationLogDto>> QueryLogsAsync(LogFilterDto filter);
    Task<CommunicationLogDto?> GetLogAsync(Guid id);
    Task<CommunicationStatsDto> GetStatsAsync(string? copropertyId);
}
