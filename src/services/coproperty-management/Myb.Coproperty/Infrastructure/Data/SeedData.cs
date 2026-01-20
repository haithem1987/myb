using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Data;

/// <summary>
/// Seed data for development and testing
/// Provides sample coproperties, units, owners, charges, and invoices
/// </summary>
public static class SeedData
{
    /// <summary>
    /// Seed the database with sample data
    /// </summary>
    public static async Task SeedAsync(CopropertyDbContext context)
    {
        // Check if data already exists
        if (context.Coproperties.Any())
            return;

        // Create sample coproperties
        var coproperty1 = new Models.Coproperty
        {
            Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440000"),
            Name = "Résidence Les Jardins",
            Address = "123 Avenue des Champs",
            City = "Paris",
            PostalCode = "75008",
            Country = "France",
            Description = "Modern residential complex with 20 units",
            CommonAreas = "Swimming pool, gym, parking",
            TotalUnits = 20,
            TotalShares = 10000,
            ManagerId = Guid.Parse("550e8400-e29b-41d4-a716-446655440001"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var coproperty2 = new Models.Coproperty
        {
            Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440002"),
            Name = "Immeuble Soleil",
            Address = "456 Rue de la Paix",
            City = "Lyon",
            PostalCode = "69001",
            Country = "France",
            Description = "Historical building renovated in 2020",
            CommonAreas = "Lobby, courtyard, concierge",
            TotalUnits = 15,
            TotalShares = 7500,
            ManagerId = Guid.Parse("550e8400-e29b-41d4-a716-446655440001"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Coproperties.AddRange(coproperty1, coproperty2);

        // Create sample owners
        var owners = new List<Owner>();
        for (int i = 1; i <= 25; i++)
        {
            owners.Add(new Owner
            {
                Id = Guid.NewGuid(),
                FirstName = $"Owner{i}",
                LastName = $"Lastname{i}",
                Email = $"owner{i}@example.com",
                Phone = $"+33123456{i:D3}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        context.Owners.AddRange(owners);

        // Create sample units for coproperty 1
        var units = new List<Unit>();
        var ownerIndex = 0;
        for (int i = 1; i <= 20; i++)
        {
            var unit = new Unit
            {
                Id = Guid.NewGuid(),
                CopropertyId = coproperty1.Id,
                UnitNumber = $"Apt {i}",
                Floor = (i - 1) / 4 + 1,
                Area = 50 + (i * 5),
                Shares = 500,
                UnitType = i % 3 == 0 ? "T3" : "T2",
                OccupancyStatus = "Occupied",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            units.Add(unit);

            // Link owner to unit
            unit.Owners = new List<Owner> { owners[ownerIndex % owners.Count] };
            ownerIndex++;
        }

        // Create sample units for coproperty 2
        for (int i = 1; i <= 15; i++)
        {
            var unit = new Unit
            {
                Id = Guid.NewGuid(),
                CopropertyId = coproperty2.Id,
                UnitNumber = $"Unit {i}",
                Floor = (i - 1) / 5 + 1,
                Area = 60 + (i * 3),
                Shares = 500,
                UnitType = i % 2 == 0 ? "T3" : "T2",
                OccupancyStatus = "Occupied",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            units.Add(unit);

            unit.Owners = new List<Owner> { owners[ownerIndex % owners.Count] };
            ownerIndex++;
        }

        context.Units.AddRange(units);

        // Create sample charges for coproperty 1
        var charge1 = new Charge
        {
            Id = Guid.NewGuid(),
            CopropertyId = coproperty1.Id,
            Name = "Entretien parties communes",
            Description = "Nettoyage et entretien des espaces communs",
            TotalAmount = 5000,
            ChargeType = ChargeType.Maintenance,
            Frequency = ChargeFrequency.Quarterly,
            DistributionMethod = DistributionMethod.Equal,
            StartDate = DateTime.UtcNow.AddMonths(-3),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var charge2 = new Charge
        {
            Id = Guid.NewGuid(),
            CopropertyId = coproperty1.Id,
            Name = "Charges de chauffage",
            Description = "Charges liées au chauffage collectif",
            TotalAmount = 3000,
            ChargeType = ChargeType.Electricity,
            Frequency = ChargeFrequency.Monthly,
            DistributionMethod = DistributionMethod.Equal,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var charge3 = new Charge
        {
            Id = Guid.NewGuid(),
            CopropertyId = coproperty1.Id,
            Name = "Travaux de rénovation",
            Description = "Rénovation de la toiture",
            TotalAmount = 10000,
            ChargeType = ChargeType.Maintenance,
            Frequency = ChargeFrequency.Exceptional,
            DistributionMethod = DistributionMethod.ByShares,
            StartDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Charges.AddRange(charge1, charge2, charge3);

        // Create charge distributions
        var distributions = new List<ChargeDistribution>();
        var coproperty1Units = units.Where(u => u.CopropertyId == coproperty1.Id).ToList();

        // Distribute charge1 equally among all units
        foreach (var unit in coproperty1Units)
        {
            distributions.Add(new ChargeDistribution
            {
                Id = Guid.NewGuid(),
                ChargeId = charge1.Id,
                UnitId = unit.Id,
                Percentage = 100m / coproperty1Units.Count,
                CreatedAt = DateTime.UtcNow
            });
        }

        context.ChargeDistributions.AddRange(distributions);

        // Create sample invoices
        var invoices = new List<CopropertyInvoice>();
        var invoiceNumber = 1000;

        foreach (var distribution in distributions)
        {
            var invoiceAmount = (charge1.TotalAmount * distribution.Percentage) / 100;

            invoices.Add(new CopropertyInvoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = $"INV-{invoiceNumber:D6}",
                ChargeId = charge1.Id,
                UnitId = distribution.UnitId,
                OwnerId = context.Units.First(u => u.Id == distribution.UnitId).Owners?.FirstOrDefault()?.Id ?? Guid.Empty,
                CopropertyId = coproperty1.Id,
                Amount = invoiceAmount,
                TaxAmount = invoiceAmount * 0.1m,
                TotalAmount = invoiceAmount * 1.1m,
                InvoiceDate = DateTime.UtcNow.AddMonths(-3),
                DueDate = DateTime.UtcNow.AddMonths(-2),
                Status = InvoiceStatus.Pending,
                CreatedBy = Guid.Empty,
                Description = "Quarterly charges",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            invoiceNumber++;
        }

        // Add some paid invoices
        var paidInvoices = invoices.Take(5).ToList();
        foreach (var invoice in paidInvoices)
        {
            invoice.Status = InvoiceStatus.Paid;
            invoice.PaidDate = invoice.DueDate.AddDays(5);

            // Create payment record
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                Amount = invoice.TotalAmount,
                PaymentDate = invoice.PaidDate.Value,
                PaymentMethod = "Bank Transfer",
                TransactionId = $"TXN-{Guid.NewGuid():N}".Substring(0, 20),
                CreatedBy = Guid.Empty,
                CreatedAt = invoice.PaidDate.Value
            };

            context.Payments.Add(payment);
            invoice.Payments = new List<Payment> { payment };
        }

        context.CopropertyInvoices.AddRange(invoices);

        // Create sample maintenance requests
        var maintenanceRequests = new List<MaintenanceRequest>();
        for (int i = 0; i < 5; i++)
        {
            maintenanceRequests.Add(new MaintenanceRequest
            {
                Id = Guid.NewGuid(),
                CopropertyId = coproperty1.Id,
                UnitId = coproperty1Units[i].Id,
                RequestedBy = Guid.Empty,
                Description = $"Maintenance issue {i + 1}",
                Category = MaintenanceCategory.Plumbing,
                Priority = i % 2 == 0 ? Priority.High : Priority.Normal,
                Status = i % 3 == 0 ? MaintenanceStatus.Completed : MaintenanceStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-10 + i),
                UpdatedAt = DateTime.UtcNow
            });
        }

        context.MaintenanceRequests.AddRange(maintenanceRequests);

        await context.SaveChangesAsync();
    }
}
