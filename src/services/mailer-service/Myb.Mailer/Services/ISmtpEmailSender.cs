using Myb.Common.Messaging.Models;

namespace Myb.Mailer.Services;

public interface ISmtpEmailSender
{
    Task SendAsync(EmailMessage message);
}
