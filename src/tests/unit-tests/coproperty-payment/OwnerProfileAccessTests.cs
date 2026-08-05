using System.Security.Claims;
using Moq;
using Myb.Coproperty.GraphQL.Queries;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Xunit;

namespace Myb.Coproperty.Payment.Tests;

public class OwnerProfileAccessTests
{
    [Fact]
    public async Task GetOwnerByUserId_DualRoleUser_CanResolveOwnProfile()
    {
        var userId = Guid.NewGuid();
        var owner = new Owner { Id = Guid.NewGuid(), UserId = userId };
        var ownerService = new Mock<IOwnerService>();
        ownerService.Setup(service => service.GetByUserIdAsync(userId))
            .ReturnsAsync(owner);
        var copropertyService = new Mock<ICopropertyService>();
        var query = new OwnerQueries();

        var result = await query.GetOwnerByUserId(
            userId,
            CreatePrincipal(userId, CopropertyAccessControl.OwnerRole, CopropertyAccessControl.SyndicRole),
            ownerService.Object,
            copropertyService.Object);

        Assert.Same(owner, result);
        copropertyService.Verify(
            service => service.GetAllAsync(It.IsAny<Guid?>()),
            Times.Never);
    }

    [Fact]
    public async Task GetOwnerByUserId_DualRoleUser_RemainsScopedForAnotherOwner()
    {
        var currentUserId = Guid.NewGuid();
        var requestedUserId = Guid.NewGuid();
        var owner = new Owner { Id = Guid.NewGuid(), UserId = requestedUserId };
        var ownerService = new Mock<IOwnerService>();
        ownerService.Setup(service => service.GetByUserIdAsync(requestedUserId))
            .ReturnsAsync(owner);
        var copropertyService = new Mock<ICopropertyService>();
        copropertyService.Setup(service => service.GetAllAsync(currentUserId))
            .ReturnsAsync(Array.Empty<global::Myb.Coproperty.Models.Coproperty>());
        var query = new OwnerQueries();

        var result = await query.GetOwnerByUserId(
            requestedUserId,
            CreatePrincipal(currentUserId, CopropertyAccessControl.OwnerRole, CopropertyAccessControl.SyndicRole),
            ownerService.Object,
            copropertyService.Object);

        Assert.Null(result);
        copropertyService.Verify(service => service.GetAllAsync(currentUserId), Times.Once);
    }

    private static ClaimsPrincipal CreatePrincipal(Guid userId, params string[] roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString())
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
    }
}
