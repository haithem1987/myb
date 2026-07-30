using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    [Migration("20260729_ZPreserveFinancialHistoryAndDeduplicateOwners")]
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(CopropertyDbContext))]
    public partial class PreserveFinancialHistoryAndDeduplicateOwners : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Owners",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Owners",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Coproperties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Coproperties",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrencySnapshot",
                table: "FundCalls",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "EUR");

            migrationBuilder.AddColumn<string>(
                name: "OwnerNameSnapshot",
                table: "CopropertyInvoices",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CopropertyNameSnapshot",
                table: "CopropertyInvoices",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitNumberSnapshot",
                table: "CopropertyInvoices",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrencySnapshot",
                table: "CopropertyInvoices",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "EUR");

            migrationBuilder.Sql(
                """
                UPDATE "FundCalls" AS fund_call
                SET "CurrencySnapshot" = coproperty."Currency"
                FROM "Coproperties" AS coproperty
                WHERE coproperty."Id" = fund_call."CopropertyId";

                UPDATE "CopropertyInvoices" AS invoice
                SET "OwnerNameSnapshot" = CONCAT_WS(' ', owner_record."FirstName", owner_record."LastName"),
                    "CopropertyNameSnapshot" = coproperty."Name",
                    "UnitNumberSnapshot" = unit_record."UnitNumber",
                    "CurrencySnapshot" = coproperty."Currency"
                FROM "Owners" AS owner_record,
                     "Units" AS unit_record,
                     "Coproperties" AS coproperty
                WHERE owner_record."Id" = invoice."OwnerId"
                  AND unit_record."Id" = invoice."UnitId"
                  AND coproperty."Id" = invoice."CopropertyId";
                """);

            // Keep one operational Owner profile per Keycloak user. Duplicate
            // rows remain in place as soft-deleted historical references.
            migrationBuilder.Sql(
                """
                WITH ranked_owners AS (
                    SELECT owner_record."Id",
                           ROW_NUMBER() OVER (
                               PARTITION BY owner_record."UserId"
                               ORDER BY
                                   CASE WHEN EXISTS (
                                       SELECT 1
                                       FROM "OwnerUnits" AS owner_unit
                                       WHERE owner_unit."OwnerId" = owner_record."Id"
                                         AND owner_unit."EndDate" IS NULL
                                   ) THEN 0 ELSE 1 END,
                                   owner_record."CreatedAt" NULLS LAST,
                                   owner_record."Id"
                           ) AS owner_rank
                    FROM "Owners" AS owner_record
                )
                UPDATE "Owners" AS owner_record
                SET "IsDeleted" = TRUE,
                    "DeletedAt" = CURRENT_TIMESTAMP,
                    "UpdatedAt" = CURRENT_TIMESTAMP
                FROM ranked_owners
                WHERE owner_record."Id" = ranked_owners."Id"
                  AND ranked_owners.owner_rank > 1;

                UPDATE "OwnerUnits" AS owner_unit
                SET "EndDate" = CURRENT_TIMESTAMP,
                    "UpdatedAt" = CURRENT_TIMESTAMP
                FROM "Owners" AS owner_record
                WHERE owner_record."Id" = owner_unit."OwnerId"
                  AND owner_record."IsDeleted" = TRUE
                  AND owner_unit."EndDate" IS NULL;
                """);

            migrationBuilder.DropIndex(
                name: "IX_Owners_UserId",
                table: "Owners");

            migrationBuilder.CreateIndex(
                name: "IX_Owners_UserId",
                table: "Owners",
                column: "UserId",
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_Owners_IsDeleted",
                table: "Owners",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Coproperties_IsDeleted",
                table: "Coproperties",
                column: "IsDeleted");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Owners_UserId", table: "Owners");
            migrationBuilder.DropIndex(name: "IX_Owners_IsDeleted", table: "Owners");
            migrationBuilder.DropIndex(name: "IX_Coproperties_IsDeleted", table: "Coproperties");

            migrationBuilder.CreateIndex(
                name: "IX_Owners_UserId",
                table: "Owners",
                column: "UserId");

            migrationBuilder.DropColumn(name: "IsDeleted", table: "Owners");
            migrationBuilder.DropColumn(name: "DeletedAt", table: "Owners");
            migrationBuilder.DropColumn(name: "IsDeleted", table: "Coproperties");
            migrationBuilder.DropColumn(name: "DeletedAt", table: "Coproperties");
            migrationBuilder.DropColumn(name: "CurrencySnapshot", table: "FundCalls");
            migrationBuilder.DropColumn(name: "OwnerNameSnapshot", table: "CopropertyInvoices");
            migrationBuilder.DropColumn(name: "CopropertyNameSnapshot", table: "CopropertyInvoices");
            migrationBuilder.DropColumn(name: "UnitNumberSnapshot", table: "CopropertyInvoices");
            migrationBuilder.DropColumn(name: "CurrencySnapshot", table: "CopropertyInvoices");
        }
    }
}
