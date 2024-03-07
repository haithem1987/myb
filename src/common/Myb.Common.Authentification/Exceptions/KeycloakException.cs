namespace Myb.Common.Authentification.Exceptions;

public class KeycloakException : Exception
{
    public KeycloakException(string message) : base(message)
    {
    }
}