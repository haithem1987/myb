using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Myb.Payment.EntityFrameWork.Infra;
using Myb.Payment.Models;

namespace Myb.Payment;

[ApiController]
[Route("api/bank-statements")]
public class BankStatementController : ControllerBase
{
    private readonly PaymentContext _context;
    private readonly IBankStatementParser _parser;
    private readonly IReconciliationEngine _engine;

    public BankStatementController(
        PaymentContext context,
        IBankStatementParser parser,
        IReconciliationEngine engine)
    {
        _context = context;
        _parser = parser;
        _engine = engine;
    }

    /// <summary>POST /api/bank-statements/import — upload an OFX or CSV file.</summary>
    [HttpPost("import")]
    public async Task<IActionResult> Import(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var extension = Path.GetExtension(file.FileName).TrimStart('.').ToUpperInvariant();
        var format = extension switch
        {
            "OFX" or "QFX" => "OFX",
            "CSV" => "CSV",
            _ => null
        };

        if (format is null)
            return BadRequest("Unsupported file format. Please upload an OFX or CSV file.");

        string content;
        using (var reader = new StreamReader(file.OpenReadStream()))
            content = await reader.ReadToEndAsync();

        var userId = User.FindFirst("sub")?.Value
                  ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? "unknown";

        var statement = new BankStatement
        {
            FileName = file.FileName,
            Format = format,
            ImportedAt = DateTime.UtcNow,
            ImportedByUserId = userId
        };

        _context.BankStatements.Add(statement);
        await _context.SaveChangesAsync();

        IReadOnlyList<BankTransaction> transactions;
        try
        {
            transactions = _parser.Parse(content, format, statement.Id);
        }
        catch (Exception ex)
        {
            _context.BankStatements.Remove(statement);
            await _context.SaveChangesAsync();
            return BadRequest($"Failed to parse file: {ex.Message}");
        }

        _context.BankTransactions.AddRange(transactions);
        await _context.SaveChangesAsync();

        var expectedPayments = await _context.Payments.ToListAsync();
        var results = _engine.Reconcile(transactions, expectedPayments, statement.Id);
        _context.ReconciliationResults.AddRange(results);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            StatementId = statement.Id,
            FileName = statement.FileName,
            TransactionCount = transactions.Count,
            AutoMatched = results.Count(r => r.Status == ReconciliationStatus.AutoMatched),
            ManualSuggestions = results.Count(r => r.Status == ReconciliationStatus.ManualSuggestion),
            Unmatched = results.Count(r => r.Status == ReconciliationStatus.Unmatched)
        });
    }

    /// <summary>GET /api/bank-statements/{id}/reconciliation — get reconciliation details.</summary>
    [HttpGet("{id:guid}/reconciliation")]
    public async Task<IActionResult> GetReconciliation(Guid id)
    {
        var statement = await _context.BankStatements
            .Include(s => s.Transactions)
            .Include(s => s.Results)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (statement is null)
            return NotFound($"Bank statement {id} not found.");

        var paymentIds = statement.Results
            .Where(r => r.MatchedPaymentId.HasValue)
            .Select(r => r.MatchedPaymentId)
            .Distinct()
            .ToHashSet();

        var payments = await _context.Payments
            .Where(p => paymentIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var items = statement.Transactions.Select(tx =>
        {
            var result = statement.Results.FirstOrDefault(r => r.BankTransactionId == tx.Id);
            StripePayment? matched = result?.MatchedPaymentId != null
                ? payments.GetValueOrDefault(result.MatchedPaymentId)
                : null;

            return new
            {
                Transaction = new
                {
                    tx.Id,
                    tx.Date,
                    tx.Amount,
                    tx.Label,
                    tx.Reference
                },
                Reconciliation = result is null ? null : new
                {
                    result.Id,
                    result.Status,
                    result.Note,
                    result.IsManuallyValidated,
                    MatchedPayment = matched is null ? null : new
                    {
                        matched.Id,
                        matched.UserId,
                        matched.Price,
                        matched.PaymentDate,
                        matched.ServiceName,
                        matched.PaymentStatus
                    }
                }
            };
        });

        return Ok(new
        {
            statement.Id,
            statement.FileName,
            statement.Format,
            statement.ImportedAt,
            Items = items
        });
    }

    /// <summary>GET /api/bank-statements/{id}/export — download reconciliation as CSV.</summary>
    [HttpGet("{id:guid}/export")]
    public async Task<IActionResult> Export(Guid id)
    {
        var statement = await _context.BankStatements
            .Include(s => s.Transactions)
            .Include(s => s.Results)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (statement is null)
            return NotFound();

        var paymentIds = statement.Results
            .Where(r => r.MatchedPaymentId != null)
            .Select(r => r.MatchedPaymentId)
            .Distinct()
            .ToHashSet();

        var payments = await _context.Payments
            .Where(p => paymentIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Date;Libellé;Référence;Montant;Statut;Paiement associé;Date paiement;Validé manuellement");

        foreach (var tx in statement.Transactions)
        {
            var result = statement.Results.FirstOrDefault(r => r.BankTransactionId == tx.Id);
            var matched = result?.MatchedPaymentId != null ? payments.GetValueOrDefault(result.MatchedPaymentId) : null;

            sb.AppendLine(string.Join(";",
                tx.Date.ToString("dd/MM/yyyy"),
                CsvEscape(tx.Label),
                CsvEscape(tx.Reference ?? ""),
                tx.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture),
                result?.Status.ToString() ?? "N/A",
                matched != null ? CsvEscape(matched.ServiceName) : "",
                matched != null ? matched.PaymentDate.ToString("dd/MM/yyyy") : "",
                result?.IsManuallyValidated.ToString() ?? "false"
            ));
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"rapprochement-{statement.ImportedAt:yyyyMMdd}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }

    private static string CsvEscape(string value) =>
        value.Contains(';') || value.Contains('"') || value.Contains('\n')
            ? $"\"{value.Replace("\"", "\"\"")}\""
            : value;

    /// <summary>POST /api/bank-statements/{statementId}/reconciliation/{resultId}/validate — manually validate a suggestion.</summary>
    [HttpPost("{statementId:guid}/reconciliation/{resultId:guid}/validate")]
    public async Task<IActionResult> Validate(Guid statementId, Guid resultId, [FromBody] ValidateReconciliationRequest request)
    {
        var result = await _context.ReconciliationResults
            .FirstOrDefaultAsync(r => r.Id == resultId && r.BankStatementId == statementId);

        if (result is null)
            return NotFound();

        result.IsManuallyValidated = true;
        if (request.MatchedPaymentId.HasValue)
            result.MatchedPaymentId = request.MatchedPaymentId;
        if (result.Status == ReconciliationStatus.ManualSuggestion || result.Status == ReconciliationStatus.Unmatched)
            result.Status = ReconciliationStatus.AutoMatched;

        await _context.SaveChangesAsync();
        return Ok(result);
    }
}

public class ValidateReconciliationRequest
{
    public int? MatchedPaymentId { get; set; }
}
