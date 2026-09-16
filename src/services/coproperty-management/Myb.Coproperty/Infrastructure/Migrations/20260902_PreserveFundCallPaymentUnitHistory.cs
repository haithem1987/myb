using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    [Migration("20260902_PreserveFundCallPaymentUnitHistory")]
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(CopropertyDbContext))]
    public partial class PreserveFundCallPaymentUnitHistory : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UnitNumberSnapshot",
                table: "FundCallPayments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            // Recover old receipts from the strongest available historical
            // source: linked invoice, embedded "Lot ..." label, then a single
            // unambiguous unit owned in the fund call's coproperty.
            migrationBuilder.Sql(
                """
                UPDATE "FundCallPayments" AS payment
                SET "UnitNumberSnapshot" = source."UnitNumber"
                FROM (
                    SELECT fund_call."Id" AS "FundCallId",
                           COALESCE(
                               (
                                   SELECT invoice."UnitNumberSnapshot"
                                   FROM "CopropertyInvoices" AS invoice
                                   WHERE invoice."FundCallId" = fund_call."Id"
                                     AND NULLIF(invoice."UnitNumberSnapshot", '') IS NOT NULL
                                   LIMIT 1
                               ),
                               NULLIF(substring(fund_call."Description" from '\(Lot\s+([^\)]+)\)'), ''),
                               (
                                   SELECT MIN(unit_record."UnitNumber")
                                   FROM "OwnerUnits" AS owner_unit
                                   JOIN "Units" AS unit_record ON unit_record."Id" = owner_unit."UnitId"
                                   WHERE owner_unit."OwnerId" = fund_call."OwnerId"
                                     AND unit_record."CopropertyId" = fund_call."CopropertyId"
                                   HAVING COUNT(DISTINCT unit_record."UnitNumber") = 1
                               )
                           ) AS "UnitNumber"
                    FROM "FundCalls" AS fund_call
                ) AS source
                WHERE source."FundCallId" = payment."FundCallId"
                  AND NULLIF(source."UnitNumber", '') IS NOT NULL
                  AND payment."UnitNumberSnapshot" IS NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnitNumberSnapshot",
                table: "FundCallPayments");
        }
    }
}
