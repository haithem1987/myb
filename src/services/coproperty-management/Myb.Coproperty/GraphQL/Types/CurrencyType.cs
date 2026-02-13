using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class CurrencyType : EnumType<Currency>
    {
        protected override void Configure(IEnumTypeDescriptor<Currency> descriptor)
        {
            descriptor.Name("Currency");
            descriptor.Description("Supported currencies for coproperty management");
            
            descriptor.Value(Currency.USD).Name("USD").Description("US Dollar");
            descriptor.Value(Currency.EUR).Name("EUR").Description("Euro");
            descriptor.Value(Currency.TND).Name("TND").Description("Tunisian Dinar");
            descriptor.Value(Currency.GBP).Name("GBP").Description("British Pound");
            descriptor.Value(Currency.CHF).Name("CHF").Description("Swiss Franc");
            descriptor.Value(Currency.CAD).Name("CAD").Description("Canadian Dollar");
            descriptor.Value(Currency.AED).Name("AED").Description("UAE Dirham");
            descriptor.Value(Currency.MAD).Name("MAD").Description("Moroccan Dirham");
        }
    }
}
