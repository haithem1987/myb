using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Common.Models
{
    public class QueryResult<TKey,TEntity> where TEntity : IEntity<TKey> 
    {
        public TEntity? Entity {  get; set; }
        public string[]? Errors { get;set; }
    }
}
