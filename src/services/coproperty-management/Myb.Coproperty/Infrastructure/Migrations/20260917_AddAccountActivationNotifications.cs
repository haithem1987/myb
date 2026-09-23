using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    [Migration("20260917_AddAccountActivationNotifications")]
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(CopropertyDbContext))]
    public partial class AddAccountActivationNotifications : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountActivationNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_AccountActivationNotifications", x => x.Id));

            migrationBuilder.CreateIndex(
                name: "IX_AccountActivationNotifications_UserId_RecipientUserId",
                table: "AccountActivationNotifications",
                columns: new[] { "UserId", "RecipientUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccountActivationNotifications_UserId_SentAt",
                table: "AccountActivationNotifications",
                columns: new[] { "UserId", "SentAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "AccountActivationNotifications");
        }
    }
}
