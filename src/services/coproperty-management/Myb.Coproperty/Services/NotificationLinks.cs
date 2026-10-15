namespace Myb.Coproperty.Services;

/// <summary>
/// Same-origin pages opened when a push notification is clicked. Owner pages live in the client
/// app; syndic pages live in the admin app, deployed under /admin/.
/// </summary>
public static class NotificationLinks
{
    public const string HighUrgency = "high";

    public static string OwnerPage(Guid copropertyId, string segment) => $"/coproperty/{copropertyId}/owner/{segment}";
    public static string SyndicPage(Guid copropertyId, string segment) => $"/admin/coproperty/{copropertyId}/syndic/{segment}";

    public const string OwnerSpaceSelection = "/coproperty/select?space=owner";
    public const string SyndicSpaceSelection = "/admin/coproperty/select?space=syndic";
}
