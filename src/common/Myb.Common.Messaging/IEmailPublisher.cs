using Myb.Common.Messaging.Models;

namespace Myb.Common.Messaging;

public interface IEmailPublisher
{
    Task PublishAsync(EmailMessage message);
}
