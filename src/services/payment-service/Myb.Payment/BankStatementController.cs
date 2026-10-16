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

    /// <summary>
    /// Extracts bank transactions from a PDF and returns them as CSV (date;libelle;montant;reference).
    /// Supports DD/MM/YYYY and YYYY-MM-DD date formats, comma or dot decimal separators.
    /// Uses PdfPig word-level extraction to reconstruct table rows line by line.
    /// </summary>
    private static string ExtractCsvFromPdf(Stream pdfStream)
    {
        using var pdfDoc = PdfDocument.Open(pdfStream);

        // Collect all words with their Y-position to reconstruct lines
        var wordsByLine = new SortedDictionary<int, List<(double x, string text)>>();

        foreach (var page in pdfDoc.GetPages())
        {
            foreach (var word in page.GetWords())
            {
                var yBucket = (int)Math.Round(page.Height - word.BoundingBox.Bottom, 0);
                if (!wordsByLine.TryGetValue(yBucket, out var lineWords))
                {
                    lineWords = new List<(double, string)>();
                    // merge close Y buckets (within 3px = same line)
                    var existing = wordsByLine.Keys.FirstOrDefault(k => Math.Abs(k - yBucket) <= 3);
                    if (existing != 0 && wordsByLine.ContainsKey(existing))
                    {
                        wordsByLine[existing].Add((word.BoundingBox.Left, word.Text));
                        continue;
                    }
                    wordsByLine[yBucket] = lineWords;
                }
                lineWords.Add((word.BoundingBox.Left, word.Text));
            }
        }

        // Patterns for date detection
        var reDateDMY  = new Regex(@"^\d{1,2}/\d{1,2}/\d{4}$");   // DD/MM/YYYY
        var reDateISO  = new Regex(@"^\d{4}-\d{2}-\d{2}$");        // YYYY-MM-DD
        // Pattern for amount: optional minus, digits, separator, 2 decimals
        var reAmount   = new Regex(@"^-?\d{1,3}(?:[,.\s]\d{3})*[,.\s]\d{2}$|^-?\d+[,.]\d{2}$");

        var rows = new List<(string date, string label, string amount, string? reference)>();

        foreach (var kv in wordsByLine)
        {
            var words = kv.Value.OrderBy(w => w.x).Select(w => w.text).ToList();
            if (words.Count < 2) continue;

            // Find a date token (first or second word)
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

            // Normalize date to YYYY-MM-DD
            string isoDate;
            if (reDateDMY.IsMatch(dateToken))
            {
                var parts = dateToken.Split('/');
                isoDate = $"{parts[2]}-{parts[1].PadLeft(2, '0')}-{parts[0].PadLeft(2, '0')}";
            }
            else
            {
                isoDate = dateToken;
            }

            // Find amount token (last few words — rightmost numeric-looking token)
            string? amountToken = null;
            int amountIdx = -1;
            for (int i = words.Count - 1; i > dateIdx; i--)
            {
                var w = words[i].Replace(" ", "").Replace(" ", "");
                if (reAmount.IsMatch(w))
                {
                    amountToken = w.Replace(",", ".").Replace(" ", "");
                    // Remove thousands separator if present (e.g. 1.234.56 → keep last dot)
                    var lastDot = amountToken.LastIndexOf('.');
                    if (lastDot >= 0)
                    {
                        var intPart = amountToken[..lastDot].Replace(".", "");
                        amountToken = intPart + "." + amountToken[(lastDot + 1)..];
                    }
                    amountIdx = i;
                    break;
                }
            }
            if (amountToken is null) continue;

            // Label = words between date and amount
            var labelWords = words.Skip(dateIdx + 1).Take(amountIdx - dateIdx - 1).ToList();
            if (labelWords.Count == 0) continue;
            var label = string.Join(" ", labelWords).Trim();

            rows.Add((isoDate, label, amountToken, null));
        }

        if (rows.Count == 0)
            return "date;libelle;montant;reference\n";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("date;libelle;montant;reference");
        foreach (var (date, label, amount, reference) in rows)
            sb.AppendLine($"{date};{label.Replace(";", " ")};{amount};{reference ?? ""}");

        return sb.ToString();
    }

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
