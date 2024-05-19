using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Document.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class ForhtMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentVersions_Documents_DocumentModelId",
                table: "DocumentVersions");

            migrationBuilder.DropForeignKey(
                name: "FK_Folders_Folders_FolderId",
                table: "Folders");

            migrationBuilder.DropIndex(
                name: "IX_Folders_FolderId",
                table: "Folders");

            migrationBuilder.DropIndex(
                name: "IX_DocumentVersions_DocumentModelId",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "FolderId",
                table: "Folders");

            migrationBuilder.DropColumn(
                name: "DocumentModelId",
                table: "DocumentVersions");

            migrationBuilder.RenameColumn(
                name: "CreatedBy",
                table: "DocumentVersions",
                newName: "UpdatedBy");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentVersions_Documents_DocumentId",
                table: "DocumentVersions");

            migrationBuilder.DropIndex(
                name: "IX_DocumentVersions_DocumentId",
                table: "DocumentVersions");

            migrationBuilder.RenameColumn(
                name: "UpdatedBy",
                table: "DocumentVersions",
                newName: "CreatedBy");

            migrationBuilder.AddColumn<int>(
                name: "FolderId",
                table: "Folders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DocumentModelId",
                table: "DocumentVersions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Folders_FolderId",
                table: "Folders",
                column: "FolderId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Folders_Folders_FolderId",
                table: "Folders",
                column: "FolderId",
                principalTable: "Folders",
                principalColumn: "Id");
        }
    }
}
