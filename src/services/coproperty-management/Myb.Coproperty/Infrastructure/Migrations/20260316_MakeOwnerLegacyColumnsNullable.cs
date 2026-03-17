using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <summary>
    /// Makes legacy Owner columns (UnitId, OwnershipPercentage, StartDate, IsMainOwner)
    /// nullable. These columns are from the pre-OwnerUnit era and are now ignored by EF.
    /// Owners created during registration have no unit assigned yet — units are assigned
    /// later by the administrator.
    /// </summary>
    public partial class MakeOwnerLegacyColumnsNullable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop FK so UnitId can be nullable (no longer required)
            migrationBuilder.DropForeignKey(
                name: "FK_Owners_Units_UnitId",
                table: "Owners");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "Owners",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<decimal>(
                name: "OwnershipPercentage",
                table: "Owners",
                type: "numeric(5,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,2)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "Owners",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<bool>(
                name: "IsMainOwner",
                table: "Owners",
                type: "boolean",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "boolean");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsMainOwner",
                table: "Owners",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "Owners",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "OwnershipPercentage",
                table: "Owners",
                type: "numeric(5,2)",
                nullable: false,
                defaultValue: 100.0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "Owners",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Owners_Units_UnitId",
                table: "Owners",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
