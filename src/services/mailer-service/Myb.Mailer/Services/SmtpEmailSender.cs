using MailKit.Net.Smtp;
using MimeKit;
using Myb.Common.Messaging.Models;

namespace Myb.Mailer.Services;

public class SmtpEmailSender : ISmtpEmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage email)
    {
        var smtp = _config.GetSection("Smtp");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            smtp["FromName"] ?? "MYB Platform",
            smtp["FromAddress"] ?? "noreply@myb.com"));
        message.To.Add(MailboxAddress.Parse(email.To));
        message.Subject = email.Subject;

        if (!string.IsNullOrEmpty(email.Cc))
            message.Cc.Add(MailboxAddress.Parse(email.Cc));
        if (!string.IsNullOrEmpty(email.ReplyTo))
            message.ReplyTo.Add(MailboxAddress.Parse(email.ReplyTo));

        message.Body = new TextPart("html") { Text = email.HtmlBody };

        using var client = new SmtpClient();
        var useSsl = bool.Parse(smtp["EnableSsl"] ?? "false");
        var port = int.Parse(smtp["Port"] ?? "1025");

        await client.ConnectAsync(smtp["Host"] ?? "mailhog", port, useSsl);

        if (!string.IsNullOrEmpty(smtp["Username"]))
            await client.AuthenticateAsync(smtp["Username"], smtp["Password"]);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("SMTP email sent to {To} [{Subject}]", email.To, email.Subject);
    }
}
