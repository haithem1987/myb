using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrencyColumnToCoproperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Coproperties",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "EUR");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Coproperties");
        }
    }
}
