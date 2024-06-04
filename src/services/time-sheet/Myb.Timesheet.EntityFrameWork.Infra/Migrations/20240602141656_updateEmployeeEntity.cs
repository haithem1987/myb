using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Myb.Timesheet.EntityFrameWork.Infra.Migrations
{
    public partial class updateEmployeeEntity : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create Employees table
            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Department = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    isManager = table.Column<bool>(type: "boolean", nullable: false),
                    ManagerId = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            // Add isManager column if it does not exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='Employees' AND column_name='isManager') THEN
                        ALTER TABLE ""Employees"" ADD ""isManager"" boolean NOT NULL DEFAULT FALSE;
                    END IF;
                END
                $$;
            ");

            // Add ManagerId column if it does not exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='Employees' AND column_name='ManagerId') THEN
                        ALTER TABLE ""Employees"" ADD ""ManagerId"" text;
                    END IF;
                END
                $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Employees");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='Employees' AND column_name='isManager') THEN
                        ALTER TABLE ""Employees"" DROP COLUMN ""isManager"";
                    END IF;
                END
                $$;
            ");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='Employees' AND column_name='ManagerId') THEN
                        ALTER TABLE ""Employees"" DROP COLUMN ""ManagerId"";
                    END IF;
                END
                $$;
            ");
        }
    }
}
