using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Invoice.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInvoiceDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TotalPrice",
                table: "InvoiceDetails",
                newName: "UnitPriceHT");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "InvoiceDetails",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "InvoiceDetails");

            migrationBuilder.RenameColumn(
                name: "UnitPriceHT",
                table: "InvoiceDetails",
                newName: "TotalPrice");
        }
    }
}
