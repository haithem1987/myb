namespace Myb.Common.Messaging.Models;

public class EmailMessage
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? Cc { get; set; }
    public string? ReplyTo { get; set; }
    public string Source { get; set; } = string.Empty;
}
