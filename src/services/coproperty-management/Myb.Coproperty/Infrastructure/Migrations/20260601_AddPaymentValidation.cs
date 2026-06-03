using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentValidation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ValidationStatus",
                table: "FundCallPayments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "FundCallPayments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ValidationStatus",
                table: "FundCallPayments");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "FundCallPayments");
        }
    }
}
