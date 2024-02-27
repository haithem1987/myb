using Microsoft.EntityFrameworkCore;
using Myb.Common.Models;

namespace Myb.Common.Repositories
{
    public interface IGenericRepository<TKey,TEntity, TContext>
        where TEntity :class, IEntity<TKey> 
        where TContext : DbContext
    {
        IEnumerable<string> GetPropertyKeys();
        IQueryable<TEntity> GetAll();
        IEnumerable<TEntity?> GetByIds(IEnumerable<TKey> keys);
        Task<QueryResult<TKey, TEntity>> InsertAsync(TEntity entity);
        Task<QueryResult<TKey, TEntity>> UpdateAsync(TEntity entity);
        Task<QueryResult<TKey, TEntity>> DeleteAsync(TKey entityId);
        TEntity? GetById(TKey keys);
    }
}