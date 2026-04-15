using HotChocolate;

namespace Myb.Coproperty.GraphQL.Types
{
    /// <summary>
    /// Input DTO for creating a Charge with date strings instead of DateTime objects.
    /// This allows us to bypass HotChocolate's DateTime scalar parsing issues.
    /// </summary>
    public class CreateChargeInput
    {
        public Guid Id { get; set; }
        public required Guid CopropertyId { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public required string ChargeType { get; set; }
        public required string Frequency { get; set; }
        public required decimal TotalAmount { get; set; }
        public required string DistributionMethod { get; set; }
        public required string StartDate { get; set; }  // String instead of DateTime
        public string? EndDate { get; set; }  // String instead of DateTime
        public bool IsActive { get; set; } = true;
        public bool IsContribution { get; set; } = false;
        public required Guid CreatedBy { get; set; }

        /// <summary>
        /// Convert this input to a Charge entity, parsing the date strings.
        /// </summary>
        public Myb.Coproperty.Models.Charge ToCharge()
        {
            // Convert snake_case to PascalCase for enum parsing
            var chargeTypePascal = ConvertToPascalCase(ChargeType);
            var distributionMethodPascal = ConvertToPascalCase(DistributionMethod);

            return new Myb.Coproperty.Models.Charge
            {
                Id = Id == Guid.Empty ? Guid.NewGuid() : Id,
                CopropertyId = CopropertyId,
                Name = Name,
                Description = Description,
                ChargeType = Enum.Parse<Myb.Coproperty.Models.ChargeType>(chargeTypePascal, ignoreCase: true),
                Frequency = Frequency,
                TotalAmount = TotalAmount,
                DistributionMethod = Enum.Parse<Myb.Coproperty.Models.DistributionMethod>(distributionMethodPascal, ignoreCase: true),
                StartDate = DateTime.TryParse(StartDate, out var startDate) 
                    ? DateTime.SpecifyKind(startDate, DateTimeKind.Utc) 
                    : DateTime.UtcNow,
                EndDate = !string.IsNullOrEmpty(EndDate) && DateTime.TryParse(EndDate, out var endDate) 
                    ? DateTime.SpecifyKind(endDate, DateTimeKind.Utc) 
                    : null,
                IsActive = IsActive,
                IsContribution = IsContribution,
                CreatedBy = CreatedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Convert UPPER_SNAKE_CASE or PascalCase to PascalCase
        /// Examples: BY_SHARES -> ByShares, CLEANING -> Cleaning
        /// </summary>
        private string ConvertToPascalCase(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;

            // If contains underscore, it's UPPER_SNAKE_CASE
            if (input.Contains('_'))
            {
                var parts = input.Split('_');
                return string.Join("", parts.Select(p => 
                    char.ToUpper(p[0]) + p.Substring(1).ToLower()));
            }

            // If all uppercase (e.g., "CLEANING"), convert to PascalCase
            if (input.All(char.IsUpper))
            {
                return char.ToUpper(input[0]) + input.Substring(1).ToLower();
            }

            // Already in correct format
            return input;
        }
    }
}
