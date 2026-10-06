namespace Myb.Mailer.Services;

/// <summary>Thrown when an email message has no valid recipient. Not retryable — the data won't change on retry.</summary>
public class InvalidEmailAddressException : Exception
{
    public InvalidEmailAddressException(string message) : base(message) { }
}
