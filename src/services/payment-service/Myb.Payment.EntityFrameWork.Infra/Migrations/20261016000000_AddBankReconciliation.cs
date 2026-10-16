using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Payment.EntityFrameWork.Infra.Migrations
{
    public partial class AddBankReconciliation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BankStatements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    Format = table.Column<string>(type: "text", nullable: false),
                    ImportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ImportedByUserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankStatements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BankTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BankStatementId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    Reference = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankTransactions_BankStatements_BankStatementId",
                        column: x => x.BankStatementId,
                        principalTable: "BankStatements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReconciliationResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BankStatementId = table.Column<Guid>(type: "uuid", nullable: false),
                    BankTransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchedPaymentId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    IsManuallyValidated = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReconciliationResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReconciliationResults_BankStatements_BankStatementId",
                        column: x => x.BankStatementId,
                        principalTable: "BankStatements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReconciliationResults_BankTransactions_BankTransactionId",
                        column: x => x.BankTransactionId,
                        principalTable: "BankTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BankTransactions_BankStatementId",
                table: "BankTransactions",
                column: "BankStatementId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationResults_BankStatementId",
                table: "ReconciliationResults",
                column: "BankStatementId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationResults_BankTransactionId",
                table: "ReconciliationResults",
                column: "BankTransactionId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ReconciliationResults");
            migrationBuilder.DropTable(name: "BankTransactions");
            migrationBuilder.DropTable(name: "BankStatements");
        }
    }
}
