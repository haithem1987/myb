using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChargeDistributionPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Add PaymentStatus column ────────────────────────────────────────
            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "ChargeDistributions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Unpaid");

            // ── Add PaidAmount column ───────────────────────────────────────────
            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "ChargeDistributions",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            // ── Add PaidAt column ───────────────────────────────────────────────
            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "ChargeDistributions",
                type: "timestamp with time zone",
                nullable: true);

            // ── Add PaymentTransactionId column ─────────────────────────────────
            migrationBuilder.AddColumn<string>(
                name: "PaymentTransactionId",
                table: "ChargeDistributions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            // ── Add PaymentMethod column ────────────────────────────────────────
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "ChargeDistributions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            // ── Index on PaymentStatus ──────────────────────────────────────────
            migrationBuilder.CreateIndex(
                name: "IX_ChargeDistributions_PaymentStatus",
                table: "ChargeDistributions",
                column: "PaymentStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChargeDistributions_PaymentStatus",
                table: "ChargeDistributions");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "ChargeDistributions");

            migrationBuilder.DropColumn(
                name: "PaymentTransactionId",
                table: "ChargeDistributions");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "ChargeDistributions");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "ChargeDistributions");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "ChargeDistributions");
        }
    }
}
