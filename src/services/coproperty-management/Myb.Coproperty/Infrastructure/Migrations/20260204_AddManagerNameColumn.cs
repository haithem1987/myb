using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddManagerNameColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ManagerName",
                table: "Coproperties",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ManagerName",
                table: "Coproperties");
        }
    }
}
