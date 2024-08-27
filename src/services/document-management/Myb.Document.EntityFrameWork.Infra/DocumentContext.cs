using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Myb.document.Model;

namespace Myb.Document.EntityFramework.Infra
{
    public class DocumentContext : DbContext
    {
        private readonly IConfiguration _configuration;

        public DocumentContext()
        {
        }

        public DocumentContext(DbContextOptions<DocumentContext> options, IConfiguration configuration)
            : base(options)
        {
            _configuration = configuration;
        }

        public DbSet<DocumentModel> Documents { get; set; }
        public DbSet<Folder> Folders { get; set; }
        public DbSet<DocumentVersion> DocumentVersions { get; set; }
        public DbSet<RootFolder> RootFolders { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DocumentModel>()
              .HasKey(d => d.Id);


            // DocumentModel - Folder Relationship (One-to-Many)
            modelBuilder.Entity<DocumentModel>()
                .HasOne(d => d.Folder)
                .WithMany(df => df.Documents)
                .HasForeignKey(d => d.FolderId)
                .IsRequired(false);
            /*
            // DocumentModel - DocumentVersion Relationship (One-to-Many)*/
            modelBuilder.Entity<DocumentVersion>()
                .HasOne(dv => dv.Document)
                .WithMany(d => d.Versions)
                .HasForeignKey(dv => dv.DocumentId)
                .IsRequired();
          


        }
    }
}
