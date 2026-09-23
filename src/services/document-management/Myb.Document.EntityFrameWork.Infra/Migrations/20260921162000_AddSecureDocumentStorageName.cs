using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Document.EntityFrameWork.Infra.Migrations;

public partial class AddSecureDocumentStorageName : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "StoredFileName",
            table: "Documents",
            type: "text",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "StoredFileName",
            table: "Documents");
    }
}
