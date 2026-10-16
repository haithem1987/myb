using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myb.Payment.EntityFrameWork.Infra;
using Myb.Payment.Models;

namespace Myb.Payment;

/// <summary>
/// Seeds test StripePayment records that match the amounts in the test OFX file
/// (test-bank-statement.ofx) so that reconciliation can auto-match them.
///
/// Only runs in Development when the Payments table is empty.
/// </summary>
public static class DevDataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PaymentContext>();

        if (await db.Payments.AnyAsync())
            return;

        // These amounts match the test OFX file transactions:
        //   TXN001  +150.00  2026-10-05
        //   TXN002  +200.00  2026-10-08
        //   TXN004  +75.00   2026-10-12
        var seed = new[]
        {
            new StripePayment
            {
                UserId = "dev-test-user",
                ServiceId = 1,
                ServiceName = "Charges copropriété — Dupont",
                Price = 150.00m,
                PaymentDate = new DateTime(2026, 10, 5, 0, 0, 0, DateTimeKind.Utc),
                PaymentStatus = "Paid",
                PaymentMethod = "BankTransfer",
                IsRecurring = false,
            },
            new StripePayment
            {
                UserId = "dev-test-user",
                ServiceId = 2,
                ServiceName = "Charges copropriété — Martin",
                Price = 200.00m,
                PaymentDate = new DateTime(2026, 10, 8, 0, 0, 0, DateTimeKind.Utc),
                PaymentStatus = "Paid",
                PaymentMethod = "BankTransfer",
                IsRecurring = false,
            },
            new StripePayment
            {
                UserId = "dev-test-user",
                ServiceId = 3,
                ServiceName = "Charges partielles — Bernard",
                Price = 75.00m,
                PaymentDate = new DateTime(2026, 10, 12, 0, 0, 0, DateTimeKind.Utc),
                PaymentStatus = "Paid",
                PaymentMethod = "BankTransfer",
                IsRecurring = false,
            },
            // Unmatched payment (no corresponding bank transaction)
            new StripePayment
            {
                UserId = "dev-test-user",
                ServiceId = 4,
                ServiceName = "Charges — Leclerc (non perçu)",
                Price = 120.00m,
                PaymentDate = new DateTime(2026, 10, 3, 0, 0, 0, DateTimeKind.Utc),
                PaymentStatus = "Pending",
                PaymentMethod = "BankTransfer",
                IsRecurring = false,
            },
        };

        db.Payments.AddRange(seed);
        await db.SaveChangesAsync();
    }
}
