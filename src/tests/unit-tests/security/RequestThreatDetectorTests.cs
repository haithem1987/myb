using Myb.Common.Authentification.Security;

namespace Myb.Security.Tests;

public class RequestThreatDetectorTests
{
    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("<img src=x onerror=alert(1)>")]
    [InlineData("javascript:alert(document.cookie)")]
    [InlineData("{\"$where\":\"sleep(5000)\"}")]
    [InlineData("{\"__proto__\":{\"admin\":true}}")]
    public void RejectsExecutablePayloads(string payload) =>
        Assert.True(RequestThreatDetector.ContainsThreat(payload));

    [Theory]
    [InlineData("Compte-rendu de l'assemblée générale")]
    [InlineData("select the preferred invoice from the list")]
    [InlineData("{\"query\":\"mutation { addFolder(name: \\\"Archives 2026\\\") }\"}")]
    public void AllowsOrdinaryBusinessText(string payload) =>
        Assert.False(RequestThreatDetector.ContainsThreat(payload));
}
