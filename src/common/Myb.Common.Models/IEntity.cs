namespace Myb.Common.Models
{
    public interface IEntity<TKey> 
    {
        TKey Id { get; set; }
        DateTime? CreatedAt { get; set; }
        DateTime? UpdatedAt { get; set; }
    }
}