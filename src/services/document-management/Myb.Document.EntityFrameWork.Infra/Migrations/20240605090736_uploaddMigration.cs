using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Document.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class uploaddMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "file",
                table: "Documents",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "file",
                table: "Documents");
        }
    }
}
