using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Notification.Migrations;

[DbContext(typeof(NotificationContext))]
[Migration("20261006120000_AddNotificationCoproperty")]
public partial class AddNotificationCoproperty : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "CopropertyId",
            table: "Notifications",
            type: "text",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Notifications_ReceiverId_CopropertyId_CreatedAt",
            table: "Notifications",
            columns: new[] { "ReceiverId", "CopropertyId", "CreatedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Notifications_ReceiverId_CopropertyId_CreatedAt",
            table: "Notifications");

        migrationBuilder.DropColumn(
            name: "CopropertyId",
            table: "Notifications");
    }
}
