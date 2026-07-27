using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFundCallHistoricalSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Preserve historical data on Call for Funds records: snapshot the owner's
            // and coproperty's display name at write time so the UI keeps showing them
            // even if the related Owner/Coproperty record is later deleted.
            migrationBuilder.AddColumn<string>(
                name: "OwnerNameSnapshot",
                table: "FundCalls",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CopropertyNameSnapshot",
                table: "FundCalls",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            // Backfill existing rows from the still-live Owner/Coproperty tables.
            migrationBuilder.Sql(@"
                UPDATE ""FundCalls"" fc
                SET ""CopropertyNameSnapshot"" = c.""Name""
                FROM ""Coproperties"" c
                WHERE fc.""CopropertyId"" = c.""Id"" AND fc.""CopropertyNameSnapshot"" IS NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""FundCalls"" fc
                SET ""OwnerNameSnapshot"" = TRIM(BOTH ' ' FROM (o.""FirstName"" || ' ' || o.""LastName""))
                FROM ""Owners"" o
                WHERE fc.""OwnerId"" = o.""Id"" AND fc.""OwnerNameSnapshot"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerNameSnapshot",
                table: "FundCalls");

            migrationBuilder.DropColumn(
                name: "CopropertyNameSnapshot",
                table: "FundCalls");
        }
    }
}
