namespace Myb.Common.Models
{
    public interface IEntity<TKey> 
    {
        TKey Id { get; set; }
        DateTime? CreatedDate { get; set; }
        DateTime? LastModifiedDate { get; set; }
    }
}