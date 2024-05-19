using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Document.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class ThirdMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentVersions_Documents_DocumentId",
                table: "DocumentVersions");

            migrationBuilder.DropIndex(
                name: "IX_DocumentVersions_DocumentId",
                table: "DocumentVersions");

            migrationBuilder.AddColumn<int>(
                name: "DocumentModelId",
                table: "DocumentVersions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersions_DocumentModelId",
                table: "DocumentVersions",
                column: "DocumentModelId");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentVersions_Documents_DocumentModelId",
                table: "DocumentVersions",
                column: "DocumentModelId",
                principalTable: "Documents",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentVersions_Documents_DocumentModelId",
                table: "DocumentVersions");

            migrationBuilder.DropIndex(
                name: "IX_DocumentVersions_DocumentModelId",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "DocumentModelId",
                table: "DocumentVersions");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersions_DocumentId",
                table: "DocumentVersions",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentVersions_Documents_DocumentId",
                table: "DocumentVersions",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
