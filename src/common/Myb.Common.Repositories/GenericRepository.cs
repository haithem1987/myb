using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Myb.Common.Models;
using Myb.Common.Utils.Extensions;

namespace Myb.Common.Repositories
{
    public class GenericRepository<TKey, TEntity, TContext> : IAsyncDisposable, IGenericRepository<TKey, TEntity, TContext>
        where TEntity : class, IEntity<TKey>, new()
        where TContext : DbContext
    {
        private readonly TContext _dbContext;
        private DbSet<TEntity> _entities;
        public GenericRepository(IDbContextFactory<TContext> contextFactory)
        {
            _dbContext = contextFactory.CreateDbContext();
            _entities = _dbContext.Set<TEntity>();
        }

        public async Task<QueryResult<TKey, TEntity>> DeleteAsync(TKey entityId)
        {
            var result = new QueryResult<TKey, TEntity>();
            try
            {
                TEntity? selectedEntity = GetById(entityId);
                if (selectedEntity == null)
                {
                    result.Errors = new[] { "entity not found" };
                    return result;
                }
                _entities.Remove(selectedEntity);
                await _dbContext.SaveChangesAsync();
                result.Entity = selectedEntity;
            }
            catch (Exception ex)
            {
                result.Errors = new[] { ex.Message };
            }
            return result;
        }

        public ValueTask DisposeAsync()
        {
            return _dbContext.DisposeAsync();
        }

        public IQueryable<TEntity> GetAll()
        {
            return _entities.AsQueryable();
        }

        public IEnumerable<TEntity?> GetByIds(IEnumerable<TKey> keys)
        {
            var results = new List<TEntity>();
            foreach (var key in keys)
            {
                var entity = GetById(key);
                if (entity == null) continue;
                results.Add(entity);
            }
            return results;
        }
        public TEntity? GetById(TKey keys)
        {
            return _entities.FirstOrDefault(x => x.Id.Equals(keys));
        }

        public IEnumerable<string> GetPropertyKeys()
        {
            var entityTypes = _dbContext.Model.GetEntityTypes();
            IEntityType? entityType = entityTypes.FirstOrDefault(e => e.ClrType == typeof(TEntity));
            if (entityType != null)
            {
                IKey? key = entityType.FindPrimaryKey();
                if (key == null)
                {
                    return Enumerable.Empty<string>();
                }
                return key.Properties.Select(p => p.Name);
            }
            return Enumerable.Empty<string>();
        }

        public async Task<QueryResult<TKey, TEntity>> InsertAsync(TEntity entity)
        {
            var result = new QueryResult<TKey, TEntity>();
            try
            {
                if (entity == null) throw new ArgumentNullException(nameof(entity));
                
                entity.CreatedAt ??= DateTime.UtcNow;
                entity.UpdatedAt ??= DateTime.UtcNow;
                _entities.Add(entity);
                await _dbContext.SaveChangesAsync();
                result.Entity = entity;
            }
            catch (Exception ex)
            {
                result.Errors = new string[] { ex.Message };
            }
            return result;
        }

        public async Task<QueryResult<TKey, TEntity>> UpdateAsync(TEntity entity)
        {
            var result = new QueryResult<TKey, TEntity>();
            try
            {
                TEntity? selectedEntity = GetById(entity.Id);
                if(selectedEntity == null) 
                {
                    result.Errors = new[] { "entity not found" };
                    return result;
                }
                
                entity.UpdatedAt ??= DateTime.UtcNow;
                
                entity.ApplyChanges(selectedEntity);
                await _dbContext.SaveChangesAsync();
                result.Entity = entity;
            }
            catch (Exception ex)
            {
                result.Errors = new[] {ex.Message}; 
            }
            return result;
        }
    }
}
