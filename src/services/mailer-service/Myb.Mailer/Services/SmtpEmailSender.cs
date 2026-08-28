using MailKit.Net.Smtp;
using MailKit.Security;
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

        var brandName = smtp["BrandName"] ?? "MYB";
        var renderedHtml = EmailTemplateRenderer.Render(email, brandName);
        message.Body = new BodyBuilder
        {
            HtmlBody = renderedHtml,
            TextBody = EmailTemplateRenderer.ToPlainText(email.HtmlBody)
        }.ToMessageBody();

        using var client = new SmtpClient();
        var port = int.Parse(smtp["Port"] ?? "1025");
        var enableSsl = bool.Parse(smtp["EnableSsl"] ?? "false");
        var startTls = bool.Parse(smtp["StartTls"] ?? "false");

        // Determine connection security:
        // - StartTls=true  → STARTTLS on port 587 (Gmail, SendGrid, etc.)
        // - EnableSsl=true → implicit SSL on port 465
        // - Neither        → no encryption (Mailhog dev)
        SecureSocketOptions socketOptions;
        if (startTls)
            socketOptions = SecureSocketOptions.StartTls;
        else if (enableSsl)
            socketOptions = SecureSocketOptions.SslOnConnect;
        else
            socketOptions = SecureSocketOptions.None;

        await client.ConnectAsync(smtp["Host"] ?? "mailhog", port, socketOptions);

        if (!string.IsNullOrEmpty(smtp["Username"]))
            await client.AuthenticateAsync(smtp["Username"], smtp["Password"]);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("SMTP email sent to {To} [{Subject}]", email.To, email.Subject);
    }
}
