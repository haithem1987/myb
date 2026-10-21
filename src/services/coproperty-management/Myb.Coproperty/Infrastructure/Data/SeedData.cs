using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Data;

/// <summary>
/// Seeds realistic demo data for Résidence Ellyssa (dev/test environments).
/// Idempotent: skips each entity group if already present.
/// </summary>
public static class SeedData
{
    // Known IDs — stable across re-seeds
    private static readonly Guid CopropertyId = Guid.Parse("51a7c8f9-cddc-4e41-89ce-3f336fd2272b");
    private static readonly Guid SystemUserId  = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public static async Task SeedAsync(CopropertyDbContext db)
    {
        if (!await db.Coproperties.AnyAsync(c => c.Id == CopropertyId))
            return; // coproperty not yet created — nothing to attach to

        // Load owners + their units once
        var owners = await db.Owners
            .Include(o => o.OwnerUnits).ThenInclude(ou => ou.Unit)
            .Where(o => o.OwnerUnits.Any(ou => ou.Unit.CopropertyId == CopropertyId))
            .ToListAsync();

        if (owners.Count == 0) return; // owners not yet seeded

        await SeedChargesAsync(db, owners);
        await SeedFundCallsAsync(db, owners);
        await SeedInterventionsAsync(db, owners);
        await SeedSignalementsAsync(db, owners);
        await SeedAssembliesAsync(db, owners);
    }

    // ─── Charges (budgetary lines) ───────────────────────────────────────────

    private static async Task SeedChargesAsync(CopropertyDbContext db, List<Owner> owners)
    {
        if (await db.Charges.AnyAsync(c => c.CopropertyId == CopropertyId)) return;

        var units = owners.SelectMany(o => o.OwnerUnits.Select(ou => ou.Unit)).DistinctBy(u => u!.Id).ToList();
        int unitCount = Math.Max(units.Count, 1);

        var charges = new[]
        {
            new Charge
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Name = "Entretien ascenseur", ChargeType = ChargeType.Maintenance,
                Frequency = "Mensuel", TotalAmount = 380m,
                DistributionMethod = DistributionMethod.Equal,
                StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true,
                CreatedBy = SystemUserId
            },
            new Charge
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Name = "Assurance immeuble", ChargeType = ChargeType.Insurance,
                Frequency = "Annuel", TotalAmount = 4500m,
                DistributionMethod = DistributionMethod.ByShares,
                StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true,
                CreatedBy = SystemUserId
            },
            new Charge
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Name = "Nettoyage parties communes", ChargeType = ChargeType.Cleaning,
                Frequency = "Mensuel", TotalAmount = 250m,
                DistributionMethod = DistributionMethod.Equal,
                StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true,
                CreatedBy = SystemUserId
            },
            new Charge
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Name = "Électricité parties communes", ChargeType = ChargeType.Electricity,
                Frequency = "Mensuel", TotalAmount = 185m,
                DistributionMethod = DistributionMethod.Equal,
                StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true,
                CreatedBy = SystemUserId
            },
            new Charge
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Name = "Frais de tenue de compte", ChargeType = ChargeType.Other,
                Frequency = "Mensuel", TotalAmount = 12.5m,
                DistributionMethod = DistributionMethod.Equal,
                StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true,
                CreatedBy = SystemUserId
            },
            new Charge
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Name = "Entretien espaces verts", ChargeType = ChargeType.Maintenance,
                Frequency = "Mensuel", TotalAmount = 200m,
                DistributionMethod = DistributionMethod.Equal,
                StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true,
                CreatedBy = SystemUserId
            },
        };

        db.Charges.AddRange(charges);
        await db.SaveChangesAsync();
    }

    // ─── Fund Calls (Appels de fonds) ────────────────────────────────────────

    private static async Task SeedFundCallsAsync(CopropertyDbContext db, List<Owner> owners)
    {
        if (await db.FundCalls.AnyAsync(f => f.CopropertyId == CopropertyId)) return;

        // These 14 owners paid (bank statement matched) + 3 still ToPay
        // Names match bank statement labels for auto-reconciliation
        var paidSlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Ben Ali Ahmed", "Trabelsi Mohamed", "Chaabane Fatima", "Miled Hana",
            "Ayari Sami", "Gharbi Rania", "Mansouri Nadia", "Bouaziz Amine",
            "Ferjani Salma", "Sassi Khaled", "Hamdi Yasmine", "Karray Bilel",
        };

        var fundCalls = new List<FundCall>();

        foreach (var owner in owners)
        {
            var fullName = $"{owner.FirstName} {owner.LastName}".Trim();
            var unitLabel = owner.OwnerUnits.FirstOrDefault()?.Unit?.UnitNumber ?? "";
            var isPaid   = paidSlugs.Contains(fullName);

            // October 2024 monthly charge — 320 TND each
            fundCalls.Add(new FundCall
            {
                Id = Guid.NewGuid(),
                CopropertyId = CopropertyId,
                OwnerId = owner.Id,
                Amount = 320m,
                DueDate = new DateTime(2024, 10, 1, 0, 0, 0, DateTimeKind.Utc),
                Description = $"Charges mensuelles — Octobre 2024 ({unitLabel})",
                Status = isPaid ? FundCallStatus.Paid : FundCallStatus.ToPay,
                OwnerNameSnapshot = fullName,
                CopropertyNameSnapshot = "Résidence Ellyssa",
                CurrencySnapshot = Currency.TND,
                IsActive = true,
                CreatedAt = new DateTime(2024, 9, 25, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 9, 25, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = SystemUserId,
            });

            // November 2024 — all ToPay
            fundCalls.Add(new FundCall
            {
                Id = Guid.NewGuid(),
                CopropertyId = CopropertyId,
                OwnerId = owner.Id,
                Amount = 320m,
                DueDate = new DateTime(2024, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                Description = $"Charges mensuelles — Novembre 2024 ({unitLabel})",
                Status = FundCallStatus.ToPay,
                OwnerNameSnapshot = fullName,
                CopropertyNameSnapshot = "Résidence Ellyssa",
                CurrencySnapshot = Currency.TND,
                IsActive = true,
                CreatedAt = new DateTime(2024, 10, 25, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 25, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = SystemUserId,
            });

            // December 2024 — all ToPay
            fundCalls.Add(new FundCall
            {
                Id = Guid.NewGuid(),
                CopropertyId = CopropertyId,
                OwnerId = owner.Id,
                Amount = 320m,
                DueDate = new DateTime(2024, 12, 1, 0, 0, 0, DateTimeKind.Utc),
                Description = $"Charges mensuelles — Décembre 2024 ({unitLabel})",
                Status = FundCallStatus.ToPay,
                OwnerNameSnapshot = fullName,
                CopropertyNameSnapshot = "Résidence Ellyssa",
                CurrencySnapshot = Currency.TND,
                IsActive = true,
                CreatedAt = new DateTime(2024, 11, 25, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 11, 25, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = SystemUserId,
            });
        }

        db.FundCalls.AddRange(fundCalls);
        await db.SaveChangesAsync();

        // Add FundCallPayments for the paid October ones
        var paidCalls = fundCalls.Where(f =>
            f.Status == FundCallStatus.Paid &&
            f.DueDate.Month == 10).ToList();

        if (paidCalls.Count > 0)
        {
            var payments = paidCalls.Select(fc => new FundCallPayment
            {
                Id = Guid.NewGuid(),
                FundCallId = fc.Id,
                Amount = fc.Amount,
                PaymentDate = fc.DueDate.AddDays(new Random(fc.Id.GetHashCode()).Next(1, 20)),
                PaymentMethod = "Virement",
                ValidationStatus = "Approved",
                Justificatif = "Rapproché via relevé bancaire — releve_ellyssa_oct2024.pdf",
                JustificatifFileName = "releve_ellyssa_oct2024.pdf",
                UnitNumberSnapshot = fc.Description.Contains('(')
                    ? fc.Description[(fc.Description.IndexOf('(') + 1)..fc.Description.IndexOf(')')]
                    : null,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = SystemUserId,
            }).ToList();

            db.FundCallPayments.AddRange(payments);
            await db.SaveChangesAsync();
        }
    }

    // ─── Interventions ───────────────────────────────────────────────────────

    private static async Task SeedInterventionsAsync(CopropertyDbContext db, List<Owner> owners)
    {
        if (await db.Interventions.AnyAsync(i => i.CopropertyId == CopropertyId)) return;

        var interventions = new[]
        {
            new Intervention
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Title = "Réparation ascenseur — panne cabine",
                Description = "L'ascenseur est tombé en panne le 14/10. Technicien OTIS appelé.",
                InterventionType = InterventionType.Elevator,
                Priority = Priority.High,
                Status = InterventionStatus.Completed,
                ProviderName = "OTIS STE",
                ProviderPhone = "+216 71 000 111",
                EstimatedCost = 380m, ActualCost = 380m,
                PlannedDate = new DateTime(2024, 10, 14, 9, 0, 0, DateTimeKind.Utc),
                StartedDate = new DateTime(2024, 10, 14, 10, 0, 0, DateTimeKind.Utc),
                CompletedDate = new DateTime(2024, 10, 14, 14, 0, 0, DateTimeKind.Utc),
                Notes = "Remplacement du câble d'entraînement. Garantie 6 mois.",
                CreatedAt = new DateTime(2024, 10, 14, 8, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 14, 14, 0, 0, DateTimeKind.Utc),
            },
            new Intervention
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Title = "Remplacement éclairage parking",
                Description = "Remplacement des néons du parking par LED basse consommation.",
                InterventionType = InterventionType.Electricity,
                Priority = Priority.Normal,
                Status = InterventionStatus.Planned,
                ProviderName = "Elec Pro Tunis",
                ProviderPhone = "+216 71 000 222",
                EstimatedCost = 650m,
                PlannedDate = new DateTime(2024, 11, 5, 9, 0, 0, DateTimeKind.Utc),
                Notes = "Devis accepté. Travaux prévus un samedi matin.",
                CreatedAt = new DateTime(2024, 10, 20, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 20, 0, 0, 0, DateTimeKind.Utc),
            },
            new Intervention
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Title = "Nettoyage toiture — feuilles mortes gouttières",
                Description = "Désengorgement des gouttières et nettoyage de la toiture terrasse.",
                InterventionType = InterventionType.RoofRepair,
                Priority = Priority.Normal,
                Status = InterventionStatus.InProgress,
                ProviderName = "Nettoyage Express",
                EstimatedCost = 350m,
                PlannedDate = new DateTime(2024, 10, 28, 8, 0, 0, DateTimeKind.Utc),
                StartedDate = new DateTime(2024, 10, 28, 8, 30, 0, DateTimeKind.Utc),
                CreatedAt = new DateTime(2024, 10, 22, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 28, 8, 30, 0, DateTimeKind.Utc),
            },
            new Intervention
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Title = "Dératisation parties communes",
                Description = "Traitement préventif annuel contre les nuisibles.",
                InterventionType = InterventionType.PestControl,
                Priority = Priority.Low,
                Status = InterventionStatus.Draft,
                EstimatedCost = 280m,
                PlannedDate = new DateTime(2024, 12, 10, 9, 0, 0, DateTimeKind.Utc),
                CreatedAt = new DateTime(2024, 10, 25, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 25, 0, 0, 0, DateTimeKind.Utc),
            },
            new Intervention
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                Title = "Assurance — dégât des eaux APT009",
                Description = "Fuite détectée depuis l'appartement 9. Expertise assurance en cours.",
                InterventionType = InterventionType.Plumbing,
                Priority = Priority.High,
                Status = InterventionStatus.InProgress,
                ProviderName = "STAR Assurances",
                EstimatedCost = 1200m,
                PlannedDate = new DateTime(2024, 10, 18, 10, 0, 0, DateTimeKind.Utc),
                StartedDate = new DateTime(2024, 10, 18, 10, 0, 0, DateTimeKind.Utc),
                Notes = "Dossier sinistre n° SIN-2024-0892. Expertise planifiée le 28/10.",
                CreatedAt = new DateTime(2024, 10, 17, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 18, 0, 0, 0, DateTimeKind.Utc),
            },
        };

        db.Interventions.AddRange(interventions);
        await db.SaveChangesAsync();
    }

    // ─── Signalements ────────────────────────────────────────────────────────

    private static async Task SeedSignalementsAsync(CopropertyDbContext db, List<Owner> owners)
    {
        if (await db.Signalements.AnyAsync(s => s.CopropertyId == CopropertyId)) return;

        var reporter1 = owners.FirstOrDefault();
        var reporter2 = owners.Skip(3).FirstOrDefault();
        var reporter3 = owners.Skip(7).FirstOrDefault();

        var signalements = new List<Signalement>();

        if (reporter1 != null)
            signalements.Add(new Signalement
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                ReportedBy = reporter1.UserId ?? SystemUserId,
                ReporterName = $"{reporter1.FirstName} {reporter1.LastName}",
                Type = SignalementType.Panne,
                Zone = SignalementZone.Ascenseur,
                Description = "L'ascenseur s'est arrêté entre 2 étages ce matin vers 8h30. Une personne a dû être aidée à sortir.",
                Status = SignalementStatus.Resolu,
                SyndicComment = "Réparé le 14/10 par OTIS. Intervention terminée.",
                ViewsCount = 12,
                CreatedAt = new DateTime(2024, 10, 14, 8, 35, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 14, 15, 0, 0, DateTimeKind.Utc),
            });

        if (reporter2 != null)
            signalements.Add(new Signalement
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                ReportedBy = reporter2.UserId ?? SystemUserId,
                ReporterName = $"{reporter2.FirstName} {reporter2.LastName}",
                Type = SignalementType.DegatsDesEaux,
                Zone = SignalementZone.Couloirs,
                Description = "Tache d'humidité au plafond du couloir 3ème étage. Semble s'agrandir.",
                Status = SignalementStatus.PrisEnCompte,
                SyndicComment = "Expertise planifiée le 28/10. Dossier assurance en cours.",
                ViewsCount = 8,
                CreatedAt = new DateTime(2024, 10, 17, 14, 20, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 18, 9, 0, 0, DateTimeKind.Utc),
            });

        if (reporter3 != null)
            signalements.Add(new Signalement
            {
                Id = Guid.NewGuid(), CopropertyId = CopropertyId,
                ReportedBy = reporter3.UserId ?? SystemUserId,
                ReporterName = $"{reporter3.FirstName} {reporter3.LastName}",
                Type = SignalementType.Degradation,
                Zone = SignalementZone.Parking,
                Description = "Rayure longue sur la porte du parking. Probablement intentionnelle.",
                Status = SignalementStatus.EnCours,
                ViewsCount = 5,
                CreatedAt = new DateTime(2024, 10, 22, 19, 10, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 22, 19, 10, 0, DateTimeKind.Utc),
            });

        signalements.Add(new Signalement
        {
            Id = Guid.NewGuid(), CopropertyId = CopropertyId,
            ReportedBy = SystemUserId,
            ReporterName = "Syndic Ellyssa",
            Type = SignalementType.Autre,
            Zone = SignalementZone.Eclairages,
            Description = "3 ampoules du couloir R+1 grillées depuis 1 semaine.",
            Status = SignalementStatus.PrisEnCompte,
            SyndicComment = "Remplacement programmé lors de la prochaine visite de maintenance.",
            ViewsCount = 3,
            CreatedAt = new DateTime(2024, 10, 20, 11, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2024, 10, 21, 9, 0, 0, DateTimeKind.Utc),
        });

        db.Signalements.AddRange(signalements);
        await db.SaveChangesAsync();
    }

    // ─── Assemblies (AG) ─────────────────────────────────────────────────────

    private static async Task SeedAssembliesAsync(CopropertyDbContext db, List<Owner> owners)
    {
        if (await db.Assemblies.AnyAsync(a => a.CopropertyId == CopropertyId)) return;

        var agOct = new Assembly
        {
            Id = Guid.NewGuid(), CopropertyId = CopropertyId,
            Title = "AG Ordinaire — Budget 2025",
            MeetingDate = new DateTime(2024, 11, 15, 18, 0, 0, DateTimeKind.Utc),
            Location = "Salle de réunion — Résidence Ellyssa",
            Agenda = "1. Approbation du budget prévisionnel 2025\n2. Renouvellement contrat ascenseur\n3. Travaux toiture — vote\n4. Questions diverses",
            AssemblyType = AssemblyType.Ordinary,
            Status = AssemblyStatus.Scheduled,
            IsActive = true,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        };

        var agPast = new Assembly
        {
            Id = Guid.NewGuid(), CopropertyId = CopropertyId,
            Title = "AG Ordinaire — Bilan 2023",
            MeetingDate = new DateTime(2024, 3, 20, 18, 0, 0, DateTimeKind.Utc),
            Location = "Salle de réunion — Résidence Ellyssa",
            Agenda = "1. Approbation des comptes 2023\n2. Quitus au syndic\n3. Budget 2024",
            Minutes = "L'assemblée a approuvé les comptes 2023 à l'unanimité. Budget 2024 voté à 85%. Quitus accordé.",
            AssemblyType = AssemblyType.Ordinary,
            Status = AssemblyStatus.Completed,
            IsActive = true,
            CreatedAt = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2024, 3, 20, 21, 0, 0, DateTimeKind.Utc),
        };

        db.Assemblies.AddRange(agOct, agPast);
        await db.SaveChangesAsync();

        // Attendance for past assembly — first 10 owners present
        var attendances = owners.Take(10).Select((o, i) => new AssemblyAttendance
        {
            Id = Guid.NewGuid(),
            AssemblyId = agPast.Id,
            OwnerId = o.Id,
            IsPresent = true,
            CheckInTime = new DateTime(2024, 3, 20, 17, 45 + i, 0, DateTimeKind.Utc),
            CreatedAt = DateTime.UtcNow,
        }).ToList();

        // A few with proxy
        attendances.AddRange(owners.Skip(10).Take(5).Select(o => new AssemblyAttendance
        {
            Id = Guid.NewGuid(),
            AssemblyId = agPast.Id,
            OwnerId = o.Id,
            IsPresent = false,
            HasProxy = true,
            ProxyHolderName = owners.First().FirstName + " " + owners.First().LastName,
            CreatedAt = DateTime.UtcNow,
        }));

        db.AssemblyAttendances.AddRange(attendances);
        await db.SaveChangesAsync();
    }
}
