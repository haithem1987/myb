using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public class SignalementService : ISignalementService
    {
        private readonly ISignalementRepository _repository;

        public SignalementService(ISignalementRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<Signalement>> GetByCopropertyIdAsync(Guid copropertyId) =>
            await _repository.GetByCopropertyIdAsync(copropertyId);

        public async Task<IEnumerable<Signalement>> GetByReporterAsync(Guid userId) =>
            await _repository.GetByReporterAsync(userId);

        public async Task<IEnumerable<Signalement>> GetByStatusAsync(Guid copropertyId, SignalementStatus status) =>
            await _repository.GetByStatusAsync(copropertyId, status);

        public async Task<Signalement?> GetByIdAsync(Guid id) =>
            await Task.FromResult(_repository.GetById(id));

        public async Task<Signalement> CreateAsync(Signalement signalement)
        {
            signalement.Id = signalement.Id == Guid.Empty ? Guid.NewGuid() : signalement.Id;
            signalement.CreatedAt = DateTime.UtcNow;
            signalement.UpdatedAt = DateTime.UtcNow;

            var result = await _repository.InsertAsync(signalement);

            if (result.Errors != null && result.Errors.Any())
                throw new InvalidOperationException($"Failed to create signalement: {string.Join(", ", result.Errors)}");

            if (result.Entity == null)
                throw new InvalidOperationException("Failed to create signalement: entity was not returned");

            return result.Entity;
        }

        public async Task<Signalement> UpdateStatusAsync(Guid id, SignalementStatus status, string? syndicComment)
        {
            var entity = _repository.GetById(id)
                ?? throw new InvalidOperationException($"Signalement {id} not found");

            entity.Status = status;
            entity.UpdatedAt = DateTime.UtcNow;
            if (syndicComment != null)
                entity.SyndicComment = syndicComment;

            await _repository.UpdateAsync(entity);
            return _repository.GetById(id)!;
        }

        public async Task IncrementViewsAsync(Guid id)
        {
            var entity = _repository.GetById(id);
            if (entity == null) return;

            entity.ViewsCount++;
            entity.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(entity);
        }

        public async Task DeleteAsync(Guid id) =>
            await _repository.DeleteAsync(id);
    }
}
