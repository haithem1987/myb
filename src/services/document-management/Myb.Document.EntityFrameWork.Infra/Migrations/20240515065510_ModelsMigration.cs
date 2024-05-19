using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Myb.Document.EntityFrameWork.Infra.Migrations
{
    /// <inheritdoc />
    public partial class ModelsMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "MYB");

            migrationBuilder.RenameColumn(
                name: "EditedBy",
                table: "Folders",
                newName: "EditedById");

            migrationBuilder.RenameColumn(
                name: "CreatedBy",
                table: "Folders",
                newName: "CreatedById");

            migrationBuilder.RenameColumn(
                name: "EditedBy",
                table: "Documents",
                newName: "EditedById");

            migrationBuilder.RenameColumn(
                name: "CreatedBy",
                table: "Documents",
                newName: "CreatedById");

            migrationBuilder.AlterColumn<long>(
                name: "DocumentSize",
                table: "Documents",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "User",
                schema: "MYB",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Username = table.Column<string>(type: "text", nullable: false),
                    Password = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserRole",
                schema: "MYB",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRole", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRole_User_UserId",
                        column: x => x.UserId,
                        principalSchema: "MYB",
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserPermission",
                schema: "MYB",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    UserRoleId = table.Column<int>(type: "integer", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPermission", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPermission_UserRole_UserRoleId",
                        column: x => x.UserRoleId,
                        principalSchema: "MYB",
                        principalTable: "UserRole",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Folders_CreatedById",
                table: "Folders",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_EditedById",
                table: "Folders",
                column: "EditedById");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CreatedById",
                table: "Documents",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_EditedById",
                table: "Documents",
                column: "EditedById");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermission_UserRoleId",
                schema: "MYB",
                table: "UserPermission",
                column: "UserRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRole_UserId",
                schema: "MYB",
                table: "UserRole",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_User_CreatedById",
                table: "Documents",
                column: "CreatedById",
                principalSchema: "MYB",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_User_EditedById",
                table: "Documents",
                column: "EditedById",
                principalSchema: "MYB",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Folders_User_CreatedById",
                table: "Folders",
                column: "CreatedById",
                principalSchema: "MYB",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Folders_User_EditedById",
                table: "Folders",
                column: "EditedById",
                principalSchema: "MYB",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_User_CreatedById",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_User_EditedById",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Folders_User_CreatedById",
                table: "Folders");

            migrationBuilder.DropForeignKey(
                name: "FK_Folders_User_EditedById",
                table: "Folders");

            migrationBuilder.DropTable(
                name: "UserPermission",
                schema: "MYB");

            migrationBuilder.DropTable(
                name: "UserRole",
                schema: "MYB");

            migrationBuilder.DropTable(
                name: "User",
                schema: "MYB");

            migrationBuilder.DropIndex(
                name: "IX_Folders_CreatedById",
                table: "Folders");

            migrationBuilder.DropIndex(
                name: "IX_Folders_EditedById",
                table: "Folders");

            migrationBuilder.DropIndex(
                name: "IX_Documents_CreatedById",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_EditedById",
                table: "Documents");

            migrationBuilder.RenameColumn(
                name: "EditedById",
                table: "Folders",
                newName: "EditedBy");

            migrationBuilder.RenameColumn(
                name: "CreatedById",
                table: "Folders",
                newName: "CreatedBy");

            migrationBuilder.RenameColumn(
                name: "EditedById",
                table: "Documents",
                newName: "EditedBy");

            migrationBuilder.RenameColumn(
                name: "CreatedById",
                table: "Documents",
                newName: "CreatedBy");

            migrationBuilder.AlterColumn<int>(
                name: "DocumentSize",
                table: "Documents",
                type: "integer",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");
        }
    }
}
