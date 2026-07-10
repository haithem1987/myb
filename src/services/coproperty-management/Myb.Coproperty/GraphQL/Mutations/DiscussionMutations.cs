using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Mutations;

public record CreateDiscussionInput(Guid CopropertyId, string Title, DiscussionKind Kind);
public record SendDiscussionMessageInput(Guid DiscussionId, string AuthorId, string AuthorName, string AuthorRole, string Body);

[ExtendObjectType("Mutation")]
public class DiscussionMutations
{
    public async Task<Discussion> CreateDiscussion(CreateDiscussionInput input,
        [Service] IDbContextFactory<CopropertyDbContext> factory)
    {
        if (string.IsNullOrWhiteSpace(input.Title)) throw new ArgumentException("Le sujet est obligatoire.");
        await using var db = await factory.CreateDbContextAsync();
        if (!await db.Coproperties.AnyAsync(x => x.Id == input.CopropertyId))
            throw new ArgumentException("Copropriété introuvable.");
        var entity = new Discussion { Id = Guid.NewGuid(), CopropertyId = input.CopropertyId, Title = input.Title.Trim(), Kind = input.Kind };
        db.Discussions.Add(entity); await db.SaveChangesAsync();
        return entity;
    }

    public async Task<DiscussionMessage> SendDiscussionMessage(SendDiscussionMessageInput input,
        [Service] IDbContextFactory<CopropertyDbContext> factory)
    {
        if (string.IsNullOrWhiteSpace(input.Body)) throw new ArgumentException("Le message est vide.");
        if (string.IsNullOrWhiteSpace(input.AuthorId) || string.IsNullOrWhiteSpace(input.AuthorName))
            throw new ArgumentException("L’auteur du message est obligatoire.");
        await using var db = await factory.CreateDbContextAsync();
        var discussion = await db.Discussions.FindAsync(input.DiscussionId)
            ?? throw new ArgumentException("Discussion introuvable.");
        var message = new DiscussionMessage {
            Id = Guid.NewGuid(), DiscussionId = discussion.Id, AuthorId = input.AuthorId,
            AuthorName = input.AuthorName.Trim(), AuthorRole = input.AuthorRole.Trim().ToLowerInvariant(), Body = input.Body.Trim()
        };
        discussion.UpdatedAt = DateTime.UtcNow;
        db.DiscussionMessages.Add(message); await db.SaveChangesAsync();
        return message;
    }

    public async Task<bool> ToggleDiscussionPin(Guid id, [Service] IDbContextFactory<CopropertyDbContext> factory)
    {
        await using var db = await factory.CreateDbContextAsync();
        var discussion = await db.Discussions.FindAsync(id) ?? throw new ArgumentException("Discussion introuvable.");
        discussion.IsPinned = !discussion.IsPinned; discussion.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(); return discussion.IsPinned;
    }
}
