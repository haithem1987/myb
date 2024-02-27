using Microsoft.EntityFrameworkCore;
using Myb.UserManager.Models;

namespace Myb.UserManager.EntityFrameWork.Infra
{
    public class UserContext :DbContext
    {
        public UserContext()
        {
                
        }
        public UserContext(DbContextOptions<UserContext> options):base(options)
        {

        }
        public virtual DbSet<User> Users { get; set; }
        public virtual DbSet<UserRole> UsersRoles { get; set; }
        public virtual DbSet<UserPermission> UsersPermissions { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("MYB").UseCollation("Latini_General_BIN");
            modelBuilder.Entity<User>().HasMany(e => e.Roles).WithMany();
            modelBuilder.Entity<UserRole>().HasMany(e=>e.UserPermissions).WithMany();
        }

    }
}
