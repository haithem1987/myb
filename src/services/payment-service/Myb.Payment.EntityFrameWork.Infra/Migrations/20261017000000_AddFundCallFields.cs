using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Payment.EntityFrameWork.Infra.Migrations
{
    public partial class AddFundCallFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FundCallId",
                table: "ReconciliationResults",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FundCallPaymentId",
                table: "ReconciliationResults",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FundCallId", table: "ReconciliationResults");
            migrationBuilder.DropColumn(name: "FundCallPaymentId", table: "ReconciliationResults");
        }
    }
}
