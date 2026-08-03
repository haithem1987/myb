using Xunit;
using Moq;
using Myb.Coproperty.Services;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Myb.Coproperty.Tests.Services
{
    /// <summary>
    /// Comprehensive unit tests for FundCallService deletion prevention logic
    /// (FRS-FCF-LCM-2026-001 §2.1, §2.5, §4.4).
    /// 
    /// Tests cover:
    /// - ✓ Deletion of true drafts (TO_PAY, no payments, no invoices, ≤30 days)
    /// - ✓ Blocking deletion of published/processed fund calls
    /// - ✓ Blocking deletion when payments exist
    /// - ✓ Blocking deletion when invoices exist
    /// - ✓ Blocking deletion when older than 30 days
    /// - ✓ Blocking deletion of CANCELLED fund calls
    /// - ✓ French error messages
    /// - ✓ Audit log creation
    /// - ✓ Idempotent behavior (no error when fund call doesn't exist)
    /// </summary>
    public class FundCallServiceTests
    {
        private readonly CopropertyDbContext _dbContext;
        private readonly Mock<IDbContextFactory<CopropertyDbContext>> _mockContextFactory;
        private readonly Mock<IEmailPublisher> _mockEmailPublisher;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IKeycloakAdminService> _mockKeycloakAdminService;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly FundCallService _fundCallService;

        private static readonly string TestUserId = "550e8400-e29b-41d4-a716-446655440000";

        public FundCallServiceTests()
        {
            // Setup in-memory database with unique name per test
            var options = new DbContextOptionsBuilder<CopropertyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new CopropertyDbContext(options);

            // Mock IDbContextFactory to return our test DbContext
            _mockContextFactory = new Mock<IDbContextFactory<CopropertyDbContext>>();
            _mockContextFactory
                .Setup(f => f.CreateDbContext())
                .Returns(_dbContext);

            // Mock other dependencies
            _mockEmailPublisher = new Mock<IEmailPublisher>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockKeycloakAdminService = new Mock<IKeycloakAdminService>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration
                .Setup(c => c["Services:FrontendUrl"])
                .Returns("https://test.example.com");

            // Create service instance with mocks
            _fundCallService = new FundCallService(
                _mockContextFactory.Object,
                _mockEmailPublisher.Object,
                _mockHttpClientFactory.Object,
                _mockKeycloakAdminService.Object,
                _mockConfiguration.Object
            );
        }

        #region ✓ Happy Path: Deletion of True Drafts

        /// <summary>
        /// FRS-FCF-LCM-2026-001 §2.1: A true draft (TO_PAY, 0 payments, 0 invoices, ≤30 days)
        /// should be hard-deleted from the database.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithTrueDraft_SucceedsAndRemovesRecord()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay, createdDaysAgo: 5);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            var fundCallIdBefore = fundCall.Id;
            Assert.Single(_dbContext.FundCalls);

            // Act
            await _fundCallService.DeleteAsync(fundCall.Id, TestUserId);

            // Assert
            Assert.Empty(_dbContext.FundCalls);
            var auditLog = _dbContext.FundCallAuditLogs.FirstOrDefault();
            Assert.NotNull(auditLog);
            Assert.Equal(fundCallIdBefore, auditLog.FundCallId);
            Assert.Equal("Deleted", auditLog.Action.ToString());
        }

        /// <summary>
        /// A newly-created fund call (status=TO_PAY, 0 days old) should be deletable.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithNewDraft_Succeeds()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay, createdDaysAgo: 0);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            await _fundCallService.DeleteAsync(fundCall.Id, TestUserId);
            Assert.Empty(_dbContext.FundCalls);
        }

        /// <summary>
        /// A draft at the 30-day grace period boundary should still be deletable.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithDraftAt30DayBoundary_Succeeds()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay, createdDaysAgo: 30);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            await _fundCallService.DeleteAsync(fundCall.Id, TestUserId);
            Assert.Empty(_dbContext.FundCalls);
        }

        #endregion

        #region ✗ Blocking: Published/Processed Status

        /// <summary>
        /// FRS-FCF-LCM-2026-001 §2.1, §4.4: Cannot delete a fund call with status PENDING_VALIDATION.
        /// Should throw InvalidOperationException with French message.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithPendingValidationStatus_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.PendingValidation);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("publié", ex.Message, StringComparison.OrdinalIgnoreCase);
            // Verify fund call still exists
            Assert.Single(_dbContext.FundCalls);
        }

        /// <summary>
        /// Cannot delete a fund call with status PAID (payment already collected).
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithPaidStatus_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.Paid);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("publié", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Cannot delete a fund call with status VALIDATED (approved).
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithValidatedStatus_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.Validated);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("publié", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        #endregion

        #region ✗ Blocking: Associated Payments

        /// <summary>
        /// FRS-FCF-LCM-2026-001 §2.1, §4.4: Cannot delete a fund call that has associated payments,
        /// even if status is still TO_PAY.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithOnePayment_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay);
            var payment = CreateSamplePayment(fundCall.Id, amount: 100m);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            _dbContext.FundCallPayments.Add(payment);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("versement", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Cannot delete if multiple payments exist.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithMultiplePayments_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay);
            var payments = new List<FundCallPayment>
            {
                CreateSamplePayment(fundCall.Id, amount: 100m),
                CreateSamplePayment(fundCall.Id, amount: 50m),
            };
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            _dbContext.FundCallPayments.AddRange(payments);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("versement", ex.Message, StringComparison.OrdinalIgnoreCase);
            Assert.Equal(2, _dbContext.FundCallPayments.Count());
        }

        #endregion

        #region ✗ Blocking: Associated Invoices

        /// <summary>
        /// FRS-FCF-LCM-2026-001 §2.1, §4.4: Cannot delete a fund call that has associated invoices.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithOneInvoice_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay);
            var invoice = CreateSampleInvoice(fundCall.Id);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            _dbContext.CopropertyInvoices.Add(invoice);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("facture", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        #endregion

        #region ✗ Blocking: Grace Period (>30 days old)

        /// <summary>
        /// Cannot delete a draft that was created more than 30 days ago,
        /// even if it has no payments or invoices.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithDraftOlderThan30Days_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay, createdDaysAgo: 31);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("30 jour", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// A draft created 60 days ago should not be deletable.
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithDraftCreated60DaysAgo_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.ToPay, createdDaysAgo: 60);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
        }

        #endregion

        #region ✗ Blocking: CANCELLED Status

        /// <summary>
        /// FRS-FCF-LCM-2026-001 §2.1: Cannot delete a CANCELLED fund call
        /// (it is kept for audit trail).
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithCancelledStatus_ThrowsWithFrenchReason()
        {
            // Arrange
            var coproperty = CreateSampleCoproperty();
            var fundCall = CreateSampleFundCall(coproperty.Id, status: FundCallStatus.Cancelled);
            
            _dbContext.Coproperties.Add(coproperty);
            _dbContext.FundCalls.Add(fundCall);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _fundCallService.DeleteAsync(fundCall.Id, TestUserId)
            );
            
            Assert.NotNull(ex.Message);
            Assert.Contains("annulé", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        #endregion

        #region Idempotency & Edge Cases

        /// <summary>
        /// FRS-FCF-LCM-2026-001 §2.1: Deleting a non-existent fund call should be idempotent
        /// (no error, silent success).
        /// </summary>
        [Fact]
        public async Task DeleteAsync_WithNonExistentId_DoesNotThrow()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            Assert.Empty(_dbContext.FundCalls);

            // Act & Assert (no exception thrown)
            await _fundCallService.DeleteAsync(nonExistentId, TestUserId);

            // Verify no audit log created (because fund call doesn't exist)
            Assert.Empty(_dbContext.FundCallAuditLogs);
        }

        #endregion

        #region EvaluateDeleteBlocker Logic

        /// <summary>
        /// EvaluateDeleteBlocker returns null for true drafts (deletable).
        /// </summary>
        [Fact]
        public void EvaluateDeleteBlocker_WithTrueDraft_ReturnsNull()
        {
            // Arrange
            var fundCall = CreateSampleFundCall(
                Guid.NewGuid(),
                status: FundCallStatus.ToPay,
                createdDaysAgo: 5
            );

            // Act
            var blocker = _fundCallService.EvaluateDeleteBlocker(fundCall);

            // Assert
            Assert.Null(blocker);
        }

        /// <summary>
        /// EvaluateDeleteBlocker returns a French message for published fund calls.
        /// </summary>
        [Fact]
        public void EvaluateDeleteBlocker_WithPublishedStatus_ReturnsFrenchMessage()
        {
            // Arrange
            var fundCall = CreateSampleFundCall(
                Guid.NewGuid(),
                status: FundCallStatus.Paid
            );

            // Act
            var blocker = _fundCallService.EvaluateDeleteBlocker(fundCall);

            // Assert
            Assert.NotNull(blocker);
            Assert.NotEmpty(blocker);
            Assert.Contains("publié", blocker, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// EvaluateDeleteBlocker returns a French message for fund calls with payments.
        /// </summary>
        [Fact]
        public void EvaluateDeleteBlocker_WithPayments_ReturnsFrenchMessage()
        {
            // Arrange
            var fundCall = CreateSampleFundCall(Guid.NewGuid(), status: FundCallStatus.ToPay);
            fundCall.Payments = new List<FundCallPayment>
            {
                CreateSamplePayment(fundCall.Id, amount: 100m)
            };

            // Act
            var blocker = _fundCallService.EvaluateDeleteBlocker(fundCall);

            // Assert
            Assert.NotNull(blocker);
            Assert.Contains("versement", blocker, StringComparison.OrdinalIgnoreCase);
        }

        #endregion

        #region Helper Methods for Test Data

        private Models.Coproperty CreateSampleCoproperty()
        {
            return new Models.Coproperty
            {
                Id = Guid.NewGuid(),
                Name = "Test Coproperty",
                Address = "123 Test Street",
                City = "Test City",
                PostalCode = "12345",
                Country = "Test Country",
                TotalUnits = 10,
                TotalShares = 1000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
        }

        private FundCall CreateSampleFundCall(
            Guid copropertyId,
            FundCallStatus status = FundCallStatus.ToPay,
            int createdDaysAgo = 0,
            string? ownerId = null)
        {
            return new FundCall
            {
                Id = Guid.NewGuid(),
                CopropertyId = copropertyId,
                OwnerId = ownerId,
                Amount = 1000m,
                DueDate = DateTime.UtcNow.AddDays(30),
                Description = $"Test Fund Call - {DateTime.UtcNow:yyyyMMddHHmmss}",
                Status = status,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-createdDaysAgo),
                CreatedBy = TestUserId,
                UpdatedAt = DateTime.UtcNow,
                Currency = "EUR",
                Payments = new List<FundCallPayment>(),
                Invoices = new List<CopropertyInvoice>()
            };
        }

        private FundCallPayment CreateSamplePayment(Guid fundCallId, decimal amount)
        {
            return new FundCallPayment
            {
                Id = Guid.NewGuid(),
                FundCallId = fundCallId,
                Amount = amount,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = "Bank Transfer",
                ValidationStatus = "Pending",
                CreatedAt = DateTime.UtcNow
            };
        }

        private CopropertyInvoice CreateSampleInvoice(Guid fundCallId)
        {
            return new CopropertyInvoice
            {
                Id = Guid.NewGuid(),
                CopropertyId = Guid.NewGuid(),
                FundCallId = fundCallId,
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}",
                Amount = 1000m,
                InvoiceDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                Currency = "EUR"
            };
        }

        #endregion
    }
}
