using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <summary>
    /// The original FundCallAuditLogs migration omitted UpdatedAt even though
    /// the entity model includes it. PostgreSQL consequently rejected every
    /// cancellation audit insert. Add the nullable column as a forward-only
    /// compatibility fix for already-deployed databases.
    /// </summary>
    [DbContext(typeof(CopropertyDbContext))]
    [Migration("20260805_AddFundCallAuditLogUpdatedAt")]
    public partial class AddFundCallAuditLogUpdatedAt : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "FundCallAuditLogs",
                type: "timestamp with time zone",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "FundCallAuditLogs");
        }
    }
}
