using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantQrOrdering.Api.Features.Staff;

namespace RestaurantQrOrdering.Api.Tests;

public sealed class AdminTests
{
    [Fact]
    public async Task Admin_staff_list_returns_staff_only()
    {
        var staff = new StaffMember(Guid.NewGuid(), "chef@example.com", "Chef", "kitchen", DateTimeOffset.UtcNow);
        var store = new RecordingAdminStore { Staff = [staff] };
        var controller = CreateController(store, Guid.NewGuid());

        var result = await controller.ListStaff(CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(store.Staff, response.Value);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
    }

    [Fact]
    public async Task Admin_role_update_rejects_unknown_roles_before_the_store()
    {
        var store = new RecordingAdminStore();
        var controller = CreateController(store, Guid.NewGuid());

        var result = await controller.UpdateRole(
            Guid.NewGuid(),
            new UpdateStaffRoleRequest { Role = "owner" },
            CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.False(store.UpdateCalled);
    }

    [Fact]
    public async Task Admin_role_update_rejects_self_role_changes()
    {
        var store = new RecordingAdminStore { UpdateResult = AdminCommandResult.SelfRoleChange };
        var actorId = Guid.NewGuid();
        var controller = CreateController(store, actorId);

        var result = await controller.UpdateRole(
            actorId,
            new UpdateStaffRoleRequest { Role = StaffRoles.Cashier },
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Admin_routes_require_authentication()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/staff/admin/staff");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static AdminController CreateController(IAdminStore store, Guid actorId)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(JwtRegisteredClaimNames.Sub, actorId.ToString())],
                "test")),
        };
        return new AdminController(store, NullLogger<AdminController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    private sealed class RecordingAdminStore : IAdminStore
    {
        public IReadOnlyList<StaffMember> Staff { get; init; } = [];
        public AdminCommandResult UpdateResult { get; init; } = AdminCommandResult.NotFound;
        public bool UpdateCalled { get; private set; }

        public Task<IReadOnlyList<StaffMember>> ListStaffAsync(CancellationToken cancellationToken) =>
            Task.FromResult(Staff);

        public Task<AdminCommandResult> UpdateRoleAsync(
            Guid actorId,
            Guid targetId,
            string role,
            CancellationToken cancellationToken)
        {
            UpdateCalled = true;
            return Task.FromResult(UpdateResult);
        }
    }
}
