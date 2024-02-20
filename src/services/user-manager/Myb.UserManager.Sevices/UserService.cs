using Myb.Common.Repositories;
using Myb.UserManager.EntityFrameWork.Infra;
using Myb.UserManager.Models;

namespace Myb.UserManager.Sevices
{
    public class UserService : IUserService 
    {
        private readonly IGenericRepository<int,User, UserContext> _genericRepo;

        public UserService(IGenericRepository<int, User, UserContext> genericRepository)
        {
            _genericRepo = genericRepository;
        }
        public User? GetById(int id)
        {
            return _genericRepo.GetById(id);
        }
        public IEnumerable<User?> GetAll() 
        {
            return _genericRepo.GetAll();
        }
        public IEnumerable<User?> GetUsersByIds(IEnumerable<int> ids)
        {
            return _genericRepo.GetByIds(ids);
        }
        public async Task<User?> Add(User user)
        {
            var result = await _genericRepo.InsertAsync(user);
            return result.Entity;
        }
        public async Task<User?> Update(User user) 
        {
            var result = await _genericRepo.UpdateAsync(user);
            return result.Entity;
        }
        public async Task<User?> Delete(int id) 
        {
            var result = await _genericRepo.DeleteAsync(id);
            return result.Entity;
        }
    }
}
