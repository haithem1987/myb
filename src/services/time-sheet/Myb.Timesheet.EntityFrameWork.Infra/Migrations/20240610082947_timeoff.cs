using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Timesheet.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class timeoff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Type",
                table: "TimeOff",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "Discriminator",
                table: "Employees",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ManagerId1",
                table: "Employees",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_ManagerId1",
                table: "Employees",
                column: "ManagerId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Employees_ManagerId1",
                table: "Employees",
                column: "ManagerId1",
                principalTable: "Employees",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Employees_ManagerId1",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_ManagerId1",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Discriminator",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ManagerId1",
                table: "Employees");

            migrationBuilder.AlterColumn<int>(
                name: "Type",
                table: "TimeOff",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
