using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    [DbContext(typeof(CopropertyDbContext))]
    [Migration("20260804_AddFundCallPaymentJustificatifFile")]
    public partial class AddFundCallPaymentJustificatifFile : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "JustificatifContentType",
                table: "FundCallPayments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JustificatifFileName",
                table: "FundCallPayments",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FundCallPaymentJustificatifFiles",
                columns: table => new
                {
                    FundCallPaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileData = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FundCallPaymentJustificatifFiles", x => x.FundCallPaymentId);
                    table.ForeignKey(
                        name: "FK_FundCallPaymentJustificatifFiles_FundCallPayments_FundCallPaymentId",
                        column: x => x.FundCallPaymentId,
                        principalTable: "FundCallPayments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "FundCallPaymentJustificatifFiles");
            migrationBuilder.DropColumn(name: "JustificatifContentType", table: "FundCallPayments");
            migrationBuilder.DropColumn(name: "JustificatifFileName", table: "FundCallPayments");
        }
    }
}
