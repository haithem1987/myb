using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Payment.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AddCopropertyIdToBankStatement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CopropertyId",
                table: "BankStatements",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BankStatements_CopropertyId",
                table: "BankStatements",
                column: "CopropertyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BankStatements_CopropertyId",
                table: "BankStatements");

            migrationBuilder.DropColumn(
                name: "CopropertyId",
                table: "BankStatements");
        }
    }
}
