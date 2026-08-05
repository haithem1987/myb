using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <summary>
    /// Creates an application-owned immutable audit table. The legacy
    /// FundCallAuditLogs table in OVH is owned by the managed administrator
    /// role and grants the application role no read or write access.
    /// </summary>
    [DbContext(typeof(CopropertyDbContext))]
    [Migration("20260805_CreateFundCallAuditEvents")]
    public partial class CreateFundCallAuditEvents : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FundCallAuditEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FundCallId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ActorDisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FundCallAuditEvents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FundCallAuditEvents_CreatedAt",
                table: "FundCallAuditEvents",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_FundCallAuditEvents_FundCallId",
                table: "FundCallAuditEvents",
                column: "FundCallId");

            migrationBuilder.CreateIndex(
                name: "IX_FundCallAuditEvents_FundCallId_CreatedAt",
                table: "FundCallAuditEvents",
                columns: new[] { "FundCallId", "CreatedAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "FundCallAuditEvents");
        }
    }
}
