using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Myb.Payment.EntityFrameWork.Infra;
using Myb.Payment.Models;
using UglyToad.PdfPig;

namespace Myb.Payment;

[ApiController]
[Route("api/bank-statements")]
public class BankStatementController : ControllerBase
{
    private readonly PaymentContext _context;
    private readonly IBankStatementParser _parser;
    private readonly IReconciliationEngine _engine;
    private readonly IFundCallServiceClient _fundCallClient;

    public BankStatementController(
        PaymentContext context,
        IBankStatementParser parser,
        IReconciliationEngine engine,
        IFundCallServiceClient fundCallClient)
    {
        _context = context;
        _parser = parser;
        _engine = engine;
        _fundCallClient = fundCallClient;
    }

    private string? GetBearerToken() =>
        HttpContext.Request.Headers.Authorization.FirstOrDefault()?.Replace("Bearer ", "");

    /// <summary>POST /api/bank-statements/import</summary>
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
            "PDF" => "PDF",
            _ => null
        };

        if (format is null)
            return BadRequest("Unsupported file format. Please upload an OFX, CSV, or PDF file.");

        string content;
        string parseFormat = format;
        if (format == "PDF")
        {
            content = ExtractCsvFromPdf(file.OpenReadStream());
            parseFormat = "CSV";
        }
        else
        {
            using var reader = new StreamReader(file.OpenReadStream());
            content = await reader.ReadToEndAsync();
        }

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
            transactions = _parser.Parse(content, parseFormat, statement.Id);
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

    /// <summary>GET /api/bank-statements/{id}/reconciliation</summary>
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
                    result.FundCallId,
                    result.FundCallPaymentId,
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

    /// <summary>GET /api/bank-statements/{id}/export</summary>
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
        sb.AppendLine("Date;Libelle;Reference;Montant;Statut;Paiement associe;Date paiement;Valide manuellement;FundCallPaymentId");

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
                result?.IsManuallyValidated.ToString() ?? "false",
                result?.FundCallPaymentId ?? ""
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

    /// <summary>
    /// POST /api/bank-statements/{statementId}/reconciliation/{resultId}/validate
    ///
    /// Validates a reconciliation result manually. When FundCallId is provided,
    /// creates a FundCallPayment in coproperty-service.
    /// </summary>
    [HttpPost("{statementId:guid}/reconciliation/{resultId:guid}/validate")]
    public async Task<IActionResult> Validate(
        Guid statementId,
        Guid resultId,
        [FromBody] ValidateReconciliationRequest request)
    {
        var result = await _context.ReconciliationResults
            .Include(r => r.BankTransaction)
            .FirstOrDefaultAsync(r => r.Id == resultId && r.BankStatementId == statementId);

        if (result is null)
            return NotFound();

        result.IsManuallyValidated = true;
        if (request.MatchedPaymentId.HasValue)
            result.MatchedPaymentId = request.MatchedPaymentId;
        if (result.Status == ReconciliationStatus.ManualSuggestion || result.Status == ReconciliationStatus.Unmatched)
            result.Status = ReconciliationStatus.AutoMatched;

        // If a FundCallId is provided, register payment in coproperty-service
        if (!string.IsNullOrWhiteSpace(request.FundCallId))
        {
            result.FundCallId = request.FundCallId;
            var token = GetBearerToken();
            if (token != null && result.BankTransaction != null)
            {
                var statement = await _context.BankStatements.FindAsync(statementId);
                var created = await _fundCallClient.CreatePaymentFromBankAsync(
                    request.FundCallId,
                    result.BankTransaction.Amount,
                    result.BankTransaction.Date,
                    result.BankTransaction.Reference ?? result.BankTransaction.Id.ToString(),
                    statement?.FileName,
                    token);

                if (created != null)
                    result.FundCallPaymentId = created.PaymentId;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new
        {
            result.Id,
            result.Status,
            result.IsManuallyValidated,
            result.FundCallId,
            result.FundCallPaymentId,
            result.Note
        });
    }

    /// <summary>GET /api/bank-statements/fund-calls/active?copropertyId=...</summary>
    [HttpGet("fund-calls/active")]
    public async Task<IActionResult> GetActiveFundCalls([FromQuery] string copropertyId)
    {
        var token = GetBearerToken();
        if (token == null)
            return Unauthorized();

        var fundCalls = await _fundCallClient.GetActiveFundCallsAsync(copropertyId, token);
        return Ok(fundCalls);
    }

    /// <summary>
    /// Extracts bank transactions from a PDF using PdfPig word-level extraction.
    /// Returns CSV with columns: date;libelle;montant;reference
    ///
    /// Handles bank statement table layout: Date | Label | [Debit] | [Credit] | Balance
    ///   - The LAST (rightmost) numeric token on each row is the running balance -> skipped.
    ///   - The SECOND-TO-LAST is the transaction amount.
    ///   - When two transaction amounts are found (separate debit/credit columns),
    ///     the rightmost non-zero is taken as credit (positive); otherwise debit (negative).
    /// Supports DD/MM/YYYY and YYYY-MM-DD date formats.
    /// </summary>
    private static string ExtractCsvFromPdf(Stream pdfStream)
    {
        using var pdfDoc = PdfDocument.Open(pdfStream);

        var wordsByLine = new SortedDictionary<int, List<(double x, string text)>>();

        foreach (var page in pdfDoc.GetPages())
        {
            foreach (var word in page.GetWords())
            {
                var yBucket = (int)Math.Round(page.Height - word.BoundingBox.Bottom, 0);
                var existing = wordsByLine.Keys.FirstOrDefault(k => Math.Abs(k - yBucket) <= 3);
                if (existing != 0 && wordsByLine.ContainsKey(existing))
                {
                    wordsByLine[existing].Add((word.BoundingBox.Left, word.Text));
                }
                else
                {
                    if (!wordsByLine.ContainsKey(yBucket))
                        wordsByLine[yBucket] = new List<(double, string)>();
                    wordsByLine[yBucket].Add((word.BoundingBox.Left, word.Text));
                }
            }
        }

        var reDateDMY = new Regex(@"^\d{1,2}/\d{1,2}/\d{4}$");
        var reDateISO = new Regex(@"^\d{4}-\d{2}-\d{2}$");
        var reAmount  = new Regex(@"^-?\d{1,3}(?:[,.\s]\d{3})*[,.\s]\d{2}$|^-?\d+[,.]\d{2}$");

        static string NormaliseAmt(string raw)
        {
            var s = raw.Replace(",", ".").Replace(" ", "");
            var dot = s.LastIndexOf('.');
            if (dot >= 0)
                s = s[..dot].Replace(".", "") + "." + s[(dot + 1)..];
            return s;
        }

        var rows = new List<(string date, string label, string amount)>();

        foreach (var kv in wordsByLine)
        {
            var words = kv.Value.OrderBy(w => w.x).Select(w => w.text).ToList();
            if (words.Count < 3) continue;

            string? dateToken = null;
            int dateIdx = -1;
            for (int i = 0; i < Math.Min(3, words.Count); i++)
            {
                if (reDateDMY.IsMatch(words[i]) || reDateISO.IsMatch(words[i]))
                {
                    dateToken = words[i];
                    dateIdx = i;
                    break;
                }
            }
            if (dateToken is null) continue;

            string isoDate = reDateDMY.IsMatch(dateToken)
                ? string.Join("-", dateToken.Split('/').Reverse())
                : dateToken;

            // Collect all numeric tokens after the date, preserving order (left to right = x order)
            var amounts = new List<(int idx, string raw)>();
            for (int i = dateIdx + 1; i < words.Count; i++)
            {
                var w = words[i].Replace(" ", "").Trim();
                if (reAmount.IsMatch(w))
                    amounts.Add((i, w));
            }

            // Need at least 2 numbers: transaction amount + running balance
            if (amounts.Count < 2) continue;

            // Last number = running balance (solde) -> skip it
            var txAmounts = amounts.Take(amounts.Count - 1).ToList();

            string amountToken;
            int firstAmtIdx;

            if (txAmounts.Count == 1)
            {
                // Single column (debit-only or credit-only row) -> treat as credit (positive)
                amountToken = NormaliseAmt(txAmounts[0].raw);
                firstAmtIdx = txAmounts[0].idx;
            }
            else
            {
                // Two columns: leftmost = debit, rightmost = credit
                // Use the rightmost non-zero value (credit); if zero, use leftmost as negative (debit)
                var rightNorm = NormaliseAmt(txAmounts[^1].raw);
                var leftNorm  = NormaliseAmt(txAmounts[0].raw);
                firstAmtIdx   = txAmounts[0].idx;

                if (decimal.TryParse(rightNorm, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var rv) && rv != 0)
                    amountToken = rightNorm;
                else
                    amountToken = "-" + leftNorm;
            }

            var labelWords = words.Skip(dateIdx + 1).Take(firstAmtIdx - dateIdx - 1).ToList();
            if (labelWords.Count == 0) continue;
            var label = string.Join(" ", labelWords).Trim();

            rows.Add((isoDate, label, amountToken));
        }

        if (rows.Count == 0)
            return "date;libelle;montant;reference\n";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("date;libelle;montant;reference");
        foreach (var (date, label, amount) in rows)
            sb.AppendLine($"{date};{label.Replace(";", " ")};{amount};");

        return sb.ToString();
    }
}

public class ValidateReconciliationRequest
{
    public int? MatchedPaymentId { get; set; }
    /// <summary>Coproperty-service FundCall ID to link this transaction to.</summary>
    public string? FundCallId { get; set; }
}
