using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myb.Coproperty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeManagerIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "ManagerId",
                table: "Coproperties",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "ManagerId",
                table: "Coproperties",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
