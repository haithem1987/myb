using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Timesheet.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class updateWorkedHoursType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<float>(
                name: "WorkedHours",
                table: "Timesheets",
                type: "real",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "WorkedHours",
                table: "Timesheets",
                type: "integer",
                nullable: false,
                oldClrType: typeof(float),
                oldType: "real");
        }
    }
}
