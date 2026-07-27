using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandPaymentTransactionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The previous VARCHAR(200) limit was too tight: the AddPaymentAsync flow
            // stores the full owner-supplied justificatif (which can include Virement
            // bank details, RIB, sender name and the original file name) on
            // ChargeDistribution.PaymentTransactionId, easily exceeding 200 chars and
            // causing a DbUpdateException ("An error occurred while saving the entity
            // changes") that aborted the whole payment transaction. The full text is
            // also preserved on FundCallPayment.Justificatif (VARCHAR(1000)).
            migrationBuilder.AlterColumn<string>(
                name: "PaymentTransactionId",
                table: "ChargeDistributions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PaymentTransactionId",
                table: "ChargeDistributions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}
