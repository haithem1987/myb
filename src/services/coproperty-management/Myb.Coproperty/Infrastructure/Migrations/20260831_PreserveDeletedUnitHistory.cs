using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    [Migration("20260831_PreserveDeletedUnitHistory")]
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(CopropertyDbContext))]
    public partial class PreserveDeletedUnitHistory : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Units",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Units",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitNumberSnapshot",
                table: "ChargeDistributions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "ChargeDistributions" AS distribution
                SET "UnitNumberSnapshot" = unit_record."UnitNumber"
                FROM "Units" AS unit_record
                WHERE unit_record."Id" = distribution."UnitId"
                  AND distribution."UnitNumberSnapshot" IS NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Units_IsDeleted",
                table: "Units",
                column: "IsDeleted");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Units_IsDeleted", table: "Units");
            migrationBuilder.DropColumn(name: "DeletedAt", table: "Units");
            migrationBuilder.DropColumn(name: "IsDeleted", table: "Units");
            migrationBuilder.DropColumn(name: "UnitNumberSnapshot", table: "ChargeDistributions");
        }
    }
}
