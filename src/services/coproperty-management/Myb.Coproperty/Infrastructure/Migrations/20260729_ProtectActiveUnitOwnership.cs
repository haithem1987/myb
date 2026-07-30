using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260729_ProtectActiveUnitOwnership")]
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(CopropertyDbContext))]
    public partial class ProtectActiveUnitOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OwnerUnits_OwnerId_UnitId",
                table: "OwnerUnits");

            migrationBuilder.DropIndex(
                name: "IX_OwnerUnits_UnitId",
                table: "OwnerUnits");

            // Older application versions allowed several active assignments for
            // the same unit. Close every duplicate except the most recent one so
            // the constraint can be introduced without deleting ownership history.
            migrationBuilder.Sql(
                """
                WITH ranked_assignments AS (
                    SELECT "Id",
                           ROW_NUMBER() OVER (
                               PARTITION BY "UnitId"
                               ORDER BY "StartDate" DESC, "CreatedAt" DESC, "Id" DESC
                           ) AS assignment_rank
                    FROM "OwnerUnits"
                    WHERE "EndDate" IS NULL
                )
                UPDATE "OwnerUnits" AS owner_unit
                SET "EndDate" = CURRENT_TIMESTAMP,
                    "UpdatedAt" = CURRENT_TIMESTAMP
                FROM ranked_assignments
                WHERE owner_unit."Id" = ranked_assignments."Id"
                  AND ranked_assignments.assignment_rank > 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_OwnerUnits_OwnerId_UnitId",
                table: "OwnerUnits",
                columns: new[] { "OwnerId", "UnitId" },
                unique: true,
                filter: "\"EndDate\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_OwnerUnits_UnitId",
                table: "OwnerUnits",
                column: "UnitId",
                unique: true,
                filter: "\"EndDate\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OwnerUnits_OwnerId_UnitId",
                table: "OwnerUnits");

            migrationBuilder.DropIndex(
                name: "IX_OwnerUnits_UnitId",
                table: "OwnerUnits");

            migrationBuilder.CreateIndex(
                name: "IX_OwnerUnits_OwnerId_UnitId",
                table: "OwnerUnits",
                columns: new[] { "OwnerId", "UnitId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OwnerUnits_UnitId",
                table: "OwnerUnits",
                column: "UnitId");
        }
    }
}
