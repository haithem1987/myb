using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFundCallAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // FRS-FCF-LCM-2026-001 — Add FundCallAuditLog table to record every
            // significant lifecycle action on a Call for Funds (Appel de Fonds)
            // for legal/financial audit retention.
            migrationBuilder.CreateTable(
                name: "FundCallAuditLogs",
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
                    table.PrimaryKey("PK_FundCallAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FundCallAuditLogs_FundCallId",
                table: "FundCallAuditLogs",
                column: "FundCallId");

            migrationBuilder.CreateIndex(
                name: "IX_FundCallAuditLogs_CreatedAt",
                table: "FundCallAuditLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_FundCallAuditLogs_FundCallId_CreatedAt",
                table: "FundCallAuditLogs",
                columns: new[] { "FundCallId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "FundCallAuditLogs");
        }
    }
}
