using System.Text.RegularExpressions;

namespace Myb.Common.Authentification.Security;

public static partial class RequestThreatDetector
{
    private const int MaximumInspectedCharacters = 15_000_000;

    public static bool ContainsThreat(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return false;

        var inspected = value.Length > MaximumInspectedCharacters
            ? value.AsSpan(0, MaximumInspectedCharacters)
            : value.AsSpan();

        return inspected.IndexOf('\0') >= 0 || DangerousPayload().IsMatch(inspected.ToString());
    }

    [GeneratedRegex(
        @"<\s*/?\s*script\b|javascript\s*:|data\s*:\s*text/html|\bon\w+\s*=|\$where\b|__proto__\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        matchTimeoutMilliseconds: 100)]
    private static partial Regex DangerousPayload();
}
