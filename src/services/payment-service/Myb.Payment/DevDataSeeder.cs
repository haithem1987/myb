using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myb.Payment.EntityFrameWork.Infra;
using Myb.Payment.Models;

namespace Myb.Payment;

/// <summary>
/// Seeds StripePayment records representing the monthly charges (320 TND each)
/// for the 14 apartments of Résidence Ellyssa — October 2024.
/// Re-seeds if the existing records don't match (e.g. after seeder change).
/// </summary>
public static class DevDataSeeder
{
    private const decimal MonthlyCharge = 320.00m;

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PaymentContext>();

        // Re-seed if no record with amount 320 exists yet
        if (await db.Payments.AnyAsync(p => p.Price == MonthlyCharge))
            return;

        var ellyssa = new[]
        {
            ("ben-ali-ahmed",   1,  "Ben Ali Ahmed",   "APT001", new DateTime(2024, 10,  2, 0, 0, 0, DateTimeKind.Utc)),
            ("trabelsi-mohamed",2,  "Trabelsi Mohamed","APT002", new DateTime(2024, 10,  2, 0, 0, 0, DateTimeKind.Utc)),
            ("chaabane-fatima", 3,  "Chaabane Fatima", "APT003", new DateTime(2024, 10,  3, 0, 0, 0, DateTimeKind.Utc)),
            ("miled-hana",      4,  "Miled Hana",      "APT004", new DateTime(2024, 10,  5, 0, 0, 0, DateTimeKind.Utc)),
            ("ayari-sami",      5,  "Ayari Sami",      "APT005", new DateTime(2024, 10,  7, 0, 0, 0, DateTimeKind.Utc)),
            ("gharbi-rania",    6,  "Gharbi Rania",    "APT006", new DateTime(2024, 10,  8, 0, 0, 0, DateTimeKind.Utc)),
            ("jebali-tarek",    7,  "Jebali Tarek",    "APT007", new DateTime(2024, 10, 11, 0, 0, 0, DateTimeKind.Utc)),
            ("mansouri-nadia",  8,  "Mansouri Nadia",  "APT008", new DateTime(2024, 10, 12, 0, 0, 0, DateTimeKind.Utc)),
            ("karray-bilel",    9,  "Karray Bilel",    "APT009", new DateTime(2024, 10, 15, 0, 0, 0, DateTimeKind.Utc)),
            ("ferjani-salma",  10,  "Ferjani Salma",   "APT010", new DateTime(2024, 10, 15, 0, 0, 0, DateTimeKind.Utc)),
            ("bouaziz-amine",  11,  "Bouaziz Amine",   "APT011", new DateTime(2024, 10, 18, 0, 0, 0, DateTimeKind.Utc)),
            ("hamdi-yasmine",  12,  "Hamdi Yasmine",   "APT012", new DateTime(2024, 10, 21, 0, 0, 0, DateTimeKind.Utc)),
            ("sassi-khaled",   13,  "Sassi Khaled",    "APT013", new DateTime(2024, 10, 22, 0, 0, 0, DateTimeKind.Utc)),
            ("dridi-sara",     14,  "Dridi Sara",      "APT014", new DateTime(2024, 10, 25, 0, 0, 0, DateTimeKind.Utc)),
        };

        var seed = ellyssa.Select(e => new StripePayment
        {
            UserId        = e.Item1,
            ServiceId     = e.Item2,
            ServiceName   = $"Charges copropriété — {e.Item3} ({e.Item4})",
            Price         = MonthlyCharge,
            PaymentDate   = e.Item5,
            PaymentStatus = "Paid",
            PaymentMethod = "BankTransfer",
            IsRecurring   = true,
        }).ToArray();

        db.Payments.AddRange(seed);
        await db.SaveChangesAsync();
    }
}
