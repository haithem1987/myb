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

    /// <summary>GET /api/bank-statements?copropertyId=...</summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? copropertyId)
    {
        var query = _context.BankStatements.AsQueryable();
        if (!string.IsNullOrEmpty(copropertyId))
            query = query.Where(s => s.CopropertyId == copropertyId);

        var statements = await query
            .OrderByDescending(s => s.ImportedAt)
            .Take(20)
            .Select(s => new
            {
                s.Id,
                s.FileName,
                s.Format,
                s.ImportedAt,
                TransactionCount = s.Transactions.Count,
                AutoMatched = s.Results.Count(r => r.Status == ReconciliationStatus.AutoMatched),
                ManualSuggestions = s.Results.Count(r => r.Status == ReconciliationStatus.ManualSuggestion),
                Unmatched = s.Results.Count(r => r.Status == ReconciliationStatus.Unmatched)
            })
            .ToListAsync();

        return Ok(statements);
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
    /// Sign detection strategy (applied in order per row):
    ///   1. Two tx amounts on the row → leftmost = debit (negate), rightmost = credit.
    ///   2. Balance delta: sign(currentBalance - prevBalance) gives the transaction sign.
    ///      Requires either a "Solde précédent" opening-balance line or a prior row.
    ///   3. Column-header proximity: detect "Débit"/"Crédit" header X positions in the
    ///      PDF and classify the amount by which header it is closest to.
    ///   4. Last resort: amount closer to balance column (gap < 60 pt) → credit, else debit.
    /// </summary>
    private static string ExtractCsvFromPdf(Stream pdfStream)
    {
        using var pdfDoc = PdfDocument.Open(pdfStream);

        var wordsByLine = new SortedDictionary<int, List<(double x, string text)>>();
        double? debitHeaderX = null, creditHeaderX = null;

        foreach (var page in pdfDoc.GetPages())
        {
            foreach (var word in page.GetWords())
            {
                var yBucket = (int)Math.Round(page.Height - word.BoundingBox.Bottom, 0);
                var existing = wordsByLine.Keys.FirstOrDefault(k => Math.Abs(k - yBucket) <= 3);
                if (existing != 0 && wordsByLine.ContainsKey(existing))
                    wordsByLine[existing].Add((word.BoundingBox.Left, word.Text));
                else
                {
                    if (!wordsByLine.ContainsKey(yBucket))
                        wordsByLine[yBucket] = new List<(double, string)>();
                    wordsByLine[yBucket].Add((word.BoundingBox.Left, word.Text));
                }

                // Detect "Débit" / "Crédit" column headers to use as fallback (option 2).
                var t = word.Text.Trim();
                if (debitHeaderX is null &&
                    (t.Equals("Débit", StringComparison.OrdinalIgnoreCase) ||
                     t.Equals("Debit", StringComparison.OrdinalIgnoreCase)))
                    debitHeaderX = word.BoundingBox.Left;
                else if (creditHeaderX is null &&
                    (t.Equals("Crédit", StringComparison.OrdinalIgnoreCase) ||
                     t.Equals("Credit", StringComparison.OrdinalIgnoreCase)))
                    creditHeaderX = word.BoundingBox.Left;
            }
        }

        var reDateDMY  = new Regex(@"^\d{1,2}/\d{1,2}/\d{4}$");
        var reDateISO  = new Regex(@"^\d{4}-\d{2}-\d{2}$");
        var reAmount   = new Regex(@"^-?\d{1,3}(?:[,.\s]\d{3})*[,.\s]\d{2}$|^-?\d+[,.]\d{2}$");
        var reSolde    = new Regex(@"\bsolde\b|\bancien\b|\bpr[eé]c[eé]dent\b|\breport\b",
                                   RegexOptions.IgnoreCase);

        static string NormaliseAmt(string raw)
        {
            var s = raw.Replace(",", ".").Replace(" ", "");
            var dot = s.LastIndexOf('.');
            if (dot >= 0) s = s[..dot].Replace(".", "") + "." + s[(dot + 1)..];
            return s;
        }

        static bool TryDec(string norm, out decimal v) =>
            decimal.TryParse(norm, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out v);

        // ── Pass 1: collect raw rows and try to find the opening balance ──────
        decimal? openingBalance = null;
        var rawRows = new List<(string isoDate, string label, List<(double x, string norm)> txAmts, double balX, string balNorm)>();

        foreach (var kv in wordsByLine)
        {
            var wordsX = kv.Value.OrderBy(w => w.x).ToList();
            var words  = wordsX.Select(w => w.text).ToList();
            if (words.Count < 2) continue;

            var lineText = string.Join(" ", words);

            // Opening-balance line: "Solde précédent", "Ancien solde", etc. — no date prefix.
            if (openingBalance is null && reSolde.IsMatch(lineText))
            {
                bool hasDate = words.Take(3).Any(w => reDateDMY.IsMatch(w) || reDateISO.IsMatch(w));
                if (!hasDate)
                {
                    for (int i = words.Count - 1; i >= 0; i--)
                    {
                        var w = words[i].Replace(" ", "").Trim();
                        if (reAmount.IsMatch(w) && TryDec(NormaliseAmt(w), out var ob))
                        {
                            openingBalance = ob;
                            break;
                        }
                    }
                    continue;
                }
            }

            if (words.Count < 3) continue;

            // Transaction row: starts with a date.
            string? dateToken = null; int dateIdx = -1;
            for (int i = 0; i < Math.Min(3, words.Count); i++)
            {
                if (reDateDMY.IsMatch(words[i]) || reDateISO.IsMatch(words[i]))
                { dateToken = words[i]; dateIdx = i; break; }
            }
            if (dateToken is null) continue;

            string isoDate = reDateDMY.IsMatch(dateToken)
                ? string.Join("-", dateToken.Split('/').Reverse()) : dateToken;

            var amounts = new List<(int idx, double x, string norm)>();
            for (int i = dateIdx + 1; i < words.Count; i++)
            {
                var w = words[i].Replace(" ", "").Trim();
                if (reAmount.IsMatch(w)) amounts.Add((i, wordsX[i].x, NormaliseAmt(w)));
            }
            if (amounts.Count < 2) continue;

            var txAmts = amounts.Take(amounts.Count - 1).Select(a => (a.x, a.norm)).ToList();
            var bal    = amounts[^1];
            var labelWords = words.Skip(dateIdx + 1).Take(amounts[0].idx - dateIdx - 1).ToList();
            if (labelWords.Count == 0) continue;

            rawRows.Add((isoDate, string.Join(" ", labelWords).Trim(), txAmts, bal.x, bal.norm));
        }

        if (rawRows.Count == 0) return "date;libelle;montant;reference\n";

        // ── Pass 2: sign each transaction ─────────────────────────────────────
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("date;libelle;montant;reference");

        decimal prevBalance  = openingBalance ?? 0m;
        bool hasPrevBalance  = openingBalance.HasValue;

        foreach (var (isoDate, label, txAmts, balX, balNorm) in rawRows)
        {
            if (!TryDec(balNorm, out var currentBalance)) continue;

            string amountToken;

            if (txAmts.Count >= 2)
            {
                // Explicit two-column layout: leftmost = debit, rightmost = credit.
                var right = txAmts[^1].norm;
                var left  = txAmts[0].norm;
                amountToken = (TryDec(right, out var rv) && rv != 0)
                    ? right
                    : (TryDec(left, out var lv) && lv > 0 ? "-" + left : left);
            }
            else if (hasPrevBalance)
            {
                // Option 1 — balance delta: sign is mathematically exact.
                var delta = currentBalance - prevBalance;
                amountToken = delta.ToString(System.Globalization.CultureInfo.InvariantCulture);
            }
            else if (debitHeaderX.HasValue || creditHeaderX.HasValue)
            {
                // Option 2 — column-header proximity.
                var txX  = txAmts[0].x;
                var norm = txAmts[0].norm;
                bool isDebit = debitHeaderX.HasValue && creditHeaderX.HasValue
                    ? Math.Abs(txX - debitHeaderX.Value) < Math.Abs(txX - creditHeaderX.Value)
                    : debitHeaderX.HasValue ? txX <= debitHeaderX.Value + 10
                                            : txX <  creditHeaderX!.Value;
                amountToken = (isDebit && TryDec(norm, out var dv) && dv > 0) ? "-" + norm : norm;
            }
            else
            {
                // Option 3 — last resort: proximity to balance column.
                var txX  = txAmts[0].x;
                var norm = txAmts[0].norm;
                amountToken = (balX - txX) > 60 ? "-" + norm : norm;
            }

            prevBalance    = currentBalance;
            hasPrevBalance = true;

            sb.AppendLine($"{isoDate};{label.Replace(";", " ")};{amountToken};");
        }

        return sb.ToString();
    }
}

public class ValidateReconciliationRequest
{
    public int? MatchedPaymentId { get; set; }
    /// <summary>Coproperty-service FundCall ID to link this transaction to.</summary>
    public string? FundCallId { get; set; }
}

