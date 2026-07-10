using Myb.Common.Models;

namespace Myb.Coproperty.Models;

public enum DiscussionKind { Discussion, Announcement }

public class Discussion : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DiscussionKind Kind { get; set; } = DiscussionKind.Discussion;
    public bool IsPinned { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    public Coproperty Coproperty { get; set; } = null!;
    public ICollection<DiscussionMessage> Messages { get; set; } = new List<DiscussionMessage>();
}

public class DiscussionMessage : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid DiscussionId { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = "owner";
    public string Body { get; set; } = string.Empty;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    public Discussion Discussion { get; set; } = null!;
}
