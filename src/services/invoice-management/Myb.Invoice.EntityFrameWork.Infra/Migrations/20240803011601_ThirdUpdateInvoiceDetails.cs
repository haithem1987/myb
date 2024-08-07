using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Invoice.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class ThirdUpdateInvoiceDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "InvoiceDetails",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unit",
                table: "InvoiceDetails");
        }
    }
}
