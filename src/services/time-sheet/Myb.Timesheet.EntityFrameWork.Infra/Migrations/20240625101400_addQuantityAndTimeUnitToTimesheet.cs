using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Timesheet.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class addQuantityAndTimeUnitToTimesheet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "Timesheets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TimeUnit",
                table: "Timesheets",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "Timesheets");

            migrationBuilder.DropColumn(
                name: "TimeUnit",
                table: "Timesheets");
        }
    }
}
