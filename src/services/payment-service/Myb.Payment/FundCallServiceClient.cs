using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace Myb.Payment;

public interface IFundCallServiceClient
{
    /// <summary>
    /// Creates a FundCallPayment in coproperty-service and auto-approves it.
    /// Returns (FundCallPaymentId, FundCallId) on success, or throws on failure.
    /// </summary>
    Task<FundCallPaymentCreatedResult?> CreatePaymentFromBankAsync(
        string fundCallId,
        decimal amount,
        DateTime paymentDate,
        string bankTransactionRef,
        string? statementFileName,
        string bearerToken);

    /// <summary>
    /// Returns active FundCalls (ToPay/PendingValidation) for a coproperty.
    /// </summary>
    Task<IReadOnlyList<FundCallSummary>> GetActiveFundCallsAsync(string copropertyId, string bearerToken);
}

public class FundCallPaymentCreatedResult
{
    public string PaymentId { get; set; } = string.Empty;
    public string FundCallId { get; set; } = string.Empty;
    public string ValidationStatus { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? Warning { get; set; }
}

public class FundCallSummary
{
    public string Id { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? OwnerName { get; set; }
    public string? CopropertyNameSnapshot { get; set; }
}

public class FundCallServiceClient : IFundCallServiceClient
{
    private readonly HttpClient _http;
    private readonly ILogger<FundCallServiceClient> _logger;

    public FundCallServiceClient(HttpClient http, ILogger<FundCallServiceClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<FundCallPaymentCreatedResult?> CreatePaymentFromBankAsync(
        string fundCallId,
        decimal amount,
        DateTime paymentDate,
        string bankTransactionRef,
        string? statementFileName,
        string bearerToken)
    {
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        var payload = new
        {
            Amount = amount,
            PaymentDate = paymentDate,
            BankTransactionRef = bankTransactionRef,
            StatementFileName = statementFileName
        };

        try
        {
            var response = await _http.PostAsJsonAsync(
                $"/internal/fund-calls/{fundCallId}/payments/from-bank", payload);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("FundCallService returned {Status} for fundCallId {FundCallId}: {Body}",
                    response.StatusCode, fundCallId, body);
                return null;
            }

            return await response.Content.ReadFromJsonAsync<FundCallPaymentCreatedResult>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create FundCallPayment for fundCallId {FundCallId}", fundCallId);
            return null;
        }
    }

    public async Task<IReadOnlyList<FundCallSummary>> GetActiveFundCallsAsync(string copropertyId, string bearerToken)
    {
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        try
        {
            var result = await _http.GetFromJsonAsync<List<FundCallSummary>>(
                $"/internal/fund-calls/active?copropertyId={copropertyId}");
            return result ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch active FundCalls for coproperty {CopropertyId}", copropertyId);
            return [];
        }
    }
}
