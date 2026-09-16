using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Myb.Common.Messaging;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;
using Xunit;

namespace Myb.Coproperty.Payment.Tests;

public class FundCallPaymentProofTests
{
    private const string TestUserId = "550e8400-e29b-41d4-a716-446655440000";

    [Fact]
    public async Task AddPaymentAsync_WithPdfProof_PersistsPaymentAndBinaryFile()
    {
        var databaseName = Guid.NewGuid().ToString();
        var factory = new TestDbContextFactory(databaseName);
        var fundCallId = Guid.NewGuid();

        await using (var seedContext = factory.CreateDbContext())
        {
            seedContext.FundCalls.Add(new FundCall
            {
                Id = fundCallId,
                CopropertyId = Guid.NewGuid(),
                Amount = 500m,
                DueDate = DateTime.UtcNow.AddDays(30),
                Description = "Test fund call",
                Status = FundCallStatus.ToPay,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = Guid.Parse(TestUserId)
            });
            await seedContext.SaveChangesAsync();
        }

        var configuration = new Mock<IConfiguration>();
        configuration.Setup(value => value["Services:FrontendUrl"])
            .Returns("https://test.example.com");
        var service = new FundCallService(
            factory,
            Mock.Of<IEmailPublisher>(),
            Mock.Of<IHttpClientFactory>(),
            Mock.Of<IKeycloakAdminService>(),
            configuration.Object);
        var pdfBytes = "%PDF-1.4 test proof"u8.ToArray();

        var payment = await service.AddPaymentAsync(
            fundCallId,
            new AddFundCallPaymentInput
            {
                Amount = 433m,
                PaymentDate = new DateTime(2026, 8, 5, 0, 0, 0, DateTimeKind.Utc),
                Justificatif = "proof.pdf",
                JustificatifFileName = "proof.pdf",
                JustificatifContentType = "application/pdf",
                JustificatifFileBase64 = Convert.ToBase64String(pdfBytes)
            },
            TestUserId);

        await using var verificationContext = factory.CreateDbContext();
        var persistedPayment = await verificationContext.FundCallPayments
            .Include(value => value.JustificatifFile)
            .SingleAsync(value => value.Id == payment.Id);
        var persistedFundCall = await verificationContext.FundCalls
            .SingleAsync(value => value.Id == fundCallId);

        Assert.Equal(FundCallStatus.PendingValidation, persistedFundCall.Status);
        Assert.Equal("proof.pdf", persistedPayment.JustificatifFileName);
        Assert.Equal("application/pdf", persistedPayment.JustificatifContentType);
        Assert.NotNull(persistedPayment.JustificatifFile);
        Assert.Equal(pdfBytes, persistedPayment.JustificatifFile!.FileData);
    }

    [Fact]
    public async Task MultiplePayments_ReservePendingAmounts_AndRejectionReopensBalance()
    {
        var factory = new TestDbContextFactory(Guid.NewGuid().ToString());
        var fundCallId = Guid.NewGuid();
        await using (var seedContext = factory.CreateDbContext())
        {
            seedContext.FundCalls.Add(new FundCall
            {
                Id = fundCallId,
                CopropertyId = Guid.NewGuid(),
                Amount = 100m,
                DueDate = DateTime.UtcNow.AddDays(30),
                Description = "Multiple payments",
                Status = FundCallStatus.ToPay,
                IsActive = true,
                CreatedBy = Guid.Parse(TestUserId)
            });
            await seedContext.SaveChangesAsync();
        }

        var service = CreateService(factory);
        var first = await service.AddPaymentAsync(fundCallId, Payment(40m), TestUserId);
        var second = await service.AddPaymentAsync(fundCallId, Payment(60m), TestUserId);

        var covered = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddPaymentAsync(fundCallId, Payment(1m), TestUserId));
        Assert.Contains("en attente de validation", covered.Message);

        await service.ReviewPaymentAsync(first.Id, true, null, TestUserId);
        await using (var pendingContext = factory.CreateDbContext())
        {
            Assert.Equal(FundCallStatus.PendingValidation,
                (await pendingContext.FundCalls.FindAsync(fundCallId))!.Status);
        }

        await service.ReviewPaymentAsync(second.Id, false, "Montant incorrect", TestUserId);
        var replacement = await service.AddPaymentAsync(fundCallId, Payment(60m), TestUserId);
        await service.ReviewPaymentAsync(replacement.Id, true, null, TestUserId);

        await using var verificationContext = factory.CreateDbContext();
        var fundCall = await verificationContext.FundCalls.FindAsync(fundCallId);
        Assert.Equal(FundCallStatus.Paid, fundCall!.Status);
        Assert.Equal(3, await verificationContext.FundCallPayments.CountAsync());
    }

    private static AddFundCallPaymentInput Payment(decimal amount) => new()
    {
        Amount = amount,
        PaymentDate = DateTime.UtcNow,
        PaymentMethod = "Espèces"
    };

    private static FundCallService CreateService(IDbContextFactory<CopropertyDbContext> factory)
    {
        var configuration = new Mock<IConfiguration>();
        configuration.Setup(value => value["Services:FrontendUrl"])
            .Returns("https://test.example.com");
        return new FundCallService(
            factory,
            Mock.Of<IEmailPublisher>(),
            Mock.Of<IHttpClientFactory>(),
            Mock.Of<IKeycloakAdminService>(),
            configuration.Object);
    }

    [Fact]
    public void PaymentProof_UsesApplicationOwnedTable()
    {
        var factory = new TestDbContextFactory(Guid.NewGuid().ToString());
        using var context = factory.CreateDbContext();

        var tableName = context.Model
            .FindEntityType(typeof(FundCallPaymentJustificatifFile))!
            .GetTableName();

        Assert.Equal("FundCallPaymentProofs", tableName);
    }

    private sealed class TestDbContextFactory(string databaseName)
        : IDbContextFactory<CopropertyDbContext>
    {
        public CopropertyDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<CopropertyDbContext>()
                .UseInMemoryDatabase(databaseName)
                .Options;
            return new CopropertyDbContext(options);
        }
    }
}
