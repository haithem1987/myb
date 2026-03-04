using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FundCallStatusOwnerPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Add OwnerId column to FundCalls ────────────────────────────────
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "FundCalls",
                type: "uuid",
                nullable: true);

            // ── Add Status column to FundCalls ──────────────────────────────────
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "FundCalls",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "ToPay");

            // ── FK: FundCalls.OwnerId → Owners.Id ──────────────────────────────
            migrationBuilder.AddForeignKey(
                name: "FK_FundCalls_Owners_OwnerId",
                table: "FundCalls",
                column: "OwnerId",
                principalTable: "Owners",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // ── Unique index: (CopropertyId, DueDate, OwnerId) ─────────────────
            migrationBuilder.CreateIndex(
                name: "IX_FundCalls_CopropertyId_DueDate_OwnerId",
                table: "FundCalls",
                columns: new[] { "CopropertyId", "DueDate", "OwnerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FundCalls_Status",
                table: "FundCalls",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_FundCalls_OwnerId",
                table: "FundCalls",
                column: "OwnerId");

            // ── Create FundCallPayments table ───────────────────────────────────
            migrationBuilder.CreateTable(
                name: "FundCallPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FundCallId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Justificatif = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FundCallPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FundCallPayments_FundCalls_FundCallId",
                        column: x => x.FundCallId,
                        principalTable: "FundCalls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FundCallPayments_FundCallId",
                table: "FundCallPayments",
                column: "FundCallId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "FundCallPayments");

            migrationBuilder.DropIndex(name: "IX_FundCalls_CopropertyId_DueDate_OwnerId", table: "FundCalls");
            migrationBuilder.DropIndex(name: "IX_FundCalls_Status", table: "FundCalls");
            migrationBuilder.DropIndex(name: "IX_FundCalls_OwnerId", table: "FundCalls");

            migrationBuilder.DropForeignKey(name: "FK_FundCalls_Owners_OwnerId", table: "FundCalls");

            migrationBuilder.DropColumn(name: "OwnerId", table: "FundCalls");
            migrationBuilder.DropColumn(name: "Status", table: "FundCalls");
        }
    }
}
