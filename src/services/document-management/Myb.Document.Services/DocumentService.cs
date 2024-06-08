using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Myb.Common.Repositories;
using Myb.document.Model;
using Myb.Document.EntityFramework.Infra;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Myb.Document.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IGenericRepository<int?, DocumentModel, DocumentContext> _documentRepository;
        private readonly ILogger _logger;


        public DocumentService(IGenericRepository<int?, DocumentModel, DocumentContext> documentRepository , ILogger<DocumentModel> logger)
        {
            _documentRepository = documentRepository;
            _logger = logger;

        }

        public Task<DocumentModel> GetDocumentByIdAsync(int id)
        {
            return Task.FromResult<DocumentModel>(_documentRepository.GetById(id));
        }


        public async Task<IEnumerable<DocumentModel>> GetAllDocumentsAsync()
        {
            return await _documentRepository.GetAll().ToListAsync();
        }

        public async Task<DocumentModel> AddDocumentAsync(DocumentModel document)
        {
            try
            {
                Console.WriteLine($"Document file: {document.file}");
                document.Id = null;
                await _documentRepository.InsertAsync(document);
                return document;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating document");
                throw;
            }
        }


        public async Task<DocumentModel> UpdateDocumentAsync(DocumentModel document)
        {

            await _documentRepository.UpdateAsync(document);
            return document;
        }

        public async Task<DocumentModel> UpdateDocumentVersionAsync(DocumentModel document, DocumentVersion version)
        {
           
            if (document == null)
            {
                throw new ArgumentNullException(nameof(document), "Document cannot be null");
            }

            if (version == null)
            {
                throw new ArgumentNullException(nameof(version), "Version cannot be null");
            }

            // Check if the document has an existing version with the same number
            if (document.Versions.Any(v => v.Number == version.Number))
            {
                throw new InvalidOperationException($"A version with number {version.Number} already exists for this document");
            }

           

            // Add the new version to the document
            document.Versions.Add(version);

            // Update the document in the repository
            await _documentRepository.UpdateAsync(document);

            return document;
        }


        //delete document
        public async Task<bool> DeleteDocumentAsync(int id)
        {
         
           await  _documentRepository.DeleteAsync(id);
            return true;
        }
        /*
        

        public async Task<IEnumerable<DocumentVersion>> GetAllVersionsByDocumentIdAsync(int documentId)
        {
            return await _documentRepository.GetAll().Include(d => d.Versions).FirstOrDefaultAsync(d => d.Id == documentId).ContinueWith(t => t.Result.Versions);
        }*/
    }
}
