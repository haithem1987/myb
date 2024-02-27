using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Common.Utils.Extensions
{
    public static class ObjectExtensions
    {
        public static void ApplyChanges<T>(this T source, T target) where T : class
        {
            var properties = typeof(T).GetProperties();
            foreach (var property in properties)
            {
                var Val = property.GetValue(source);
                if(Val != null)
                {
                    property.SetValue(target, Val);
                }
            }
        }
        public static void ApplyChanges(this object source, object target) 
        {
            var properties = source.GetType().GetProperties();
            foreach (var property in properties)
            {
                var Val = property.GetValue(source);
                if (Val != null)
                {
                    property.SetValue(target, Val);
                }
            }
        }
    }
}
