using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <summary>
    /// Creates an application-owned proof table. The earlier attachment table
    /// can be owned by the OVH managed administrator, which prevents the runtime
    /// application role from inserting uploaded payment proofs.
    /// </summary>
    [DbContext(typeof(CopropertyDbContext))]
    [Migration("20260805_ZCreateFundCallPaymentProofs")]
    public partial class ZCreateFundCallPaymentProofs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FundCallPaymentProofs",
                columns: table => new
                {
                    FundCallPaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileData = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FundCallPaymentProofs", value => value.FundCallPaymentId);
                });

            // Deliberately no database FK: creating one requires REFERENCES on
            // the administrator-owned FundCallPayments table. EF still orders
            // parent/child inserts through the configured model relationship.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "FundCallPaymentProofs");
        }
    }
}
