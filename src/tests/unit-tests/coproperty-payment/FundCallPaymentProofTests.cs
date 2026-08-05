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
