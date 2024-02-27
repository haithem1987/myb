namespace Myb.Common.Models
{
    public interface IEntity<TKey> 
    {
        TKey Id { get; set; }
    }
}