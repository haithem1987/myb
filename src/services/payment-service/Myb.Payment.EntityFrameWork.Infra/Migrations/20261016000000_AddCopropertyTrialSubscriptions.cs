using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Payment.EntityFrameWork.Infra.Migrations
{
    [DbContext(typeof(PaymentContext))]
    [Migration("20261016000000_AddCopropertyTrialSubscriptions")]
    public partial class AddCopropertyTrialSubscriptions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CopropertyId",
                table: "Payments",
                schema: "payment",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CopropertyId",
                table: "Payments",
                schema: "payment",
                column: "CopropertyId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_CopropertyId",
                table: "Payments",
                schema: "payment");

            migrationBuilder.DropColumn(
                name: "CopropertyId",
                table: "Payments",
                schema: "payment");
        }
    }
}
