using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Myb.Coproperty.Infrastructure.Data;

#nullable disable
namespace Myb.Coproperty.Infrastructure.Migrations;

[DbContext(typeof(CopropertyDbContext))]
[Migration("20260707_AddDiscussions")]
public partial class AddDiscussions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "Discussions", columns: table => new {
            Id = table.Column<Guid>(type: "uuid", nullable: false), CopropertyId = table.Column<Guid>(type: "uuid", nullable: false),
            Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
            Kind = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
            IsPinned = table.Column<bool>(type: "boolean", nullable: false),
            CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
            UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
        }, constraints: table => { table.PrimaryKey("PK_Discussions", x => x.Id); table.ForeignKey("FK_Discussions_Coproperties_CopropertyId", x => x.CopropertyId, "Coproperties", "Id", onDelete: ReferentialAction.Cascade); });
        migrationBuilder.CreateTable(name: "DiscussionMessages", columns: table => new {
            Id = table.Column<Guid>(type: "uuid", nullable: false), DiscussionId = table.Column<Guid>(type: "uuid", nullable: false),
            AuthorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
            AuthorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
            AuthorRole = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
            Body = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
            CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
            UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
        }, constraints: table => { table.PrimaryKey("PK_DiscussionMessages", x => x.Id); table.ForeignKey("FK_DiscussionMessages_Discussions_DiscussionId", x => x.DiscussionId, "Discussions", "Id", onDelete: ReferentialAction.Cascade); });
        migrationBuilder.CreateIndex("IX_Discussions_CopropertyId_UpdatedAt", "Discussions", new[] { "CopropertyId", "UpdatedAt" });
        migrationBuilder.CreateIndex("IX_DiscussionMessages_DiscussionId_CreatedAt", "DiscussionMessages", new[] { "DiscussionId", "CreatedAt" });
    }
    protected override void Down(MigrationBuilder migrationBuilder) { migrationBuilder.DropTable("DiscussionMessages"); migrationBuilder.DropTable("Discussions"); }
}
