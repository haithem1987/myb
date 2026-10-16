using System.Globalization;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Myb.Payment.Models;

namespace Myb.Payment;

public interface IBankStatementParser
{
    IReadOnlyList<BankTransaction> Parse(string content, string format, Guid statementId);
}

public class BankStatementParser : IBankStatementParser
{
    public IReadOnlyList<BankTransaction> Parse(string content, string format, Guid statementId)
    {
        return format.ToUpperInvariant() switch
        {
            "OFX" => ParseOfx(content, statementId),
            "CSV" => ParseCsv(content, statementId),
            _ => throw new NotSupportedException($"Format '{format}' is not supported.")
        };
    }

    private static List<BankTransaction> ParseOfx(string content, Guid statementId)
    {
        var transactions = new List<BankTransaction>();

        // Handle both SGML-style OFX and XML-based OFX 2.x
        if (content.TrimStart().StartsWith("<?xml", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("<OFX>", StringComparison.OrdinalIgnoreCase))
        {
            // OFX 2.x (XML) — strip any leading SGML headers
            var xmlStart = content.IndexOf('<');
            if (xmlStart > 0) content = content[xmlStart..];

            try
            {
                var doc = XDocument.Parse(content);
                var stmtTrns = doc.Descendants("STMTTRN");
                foreach (var trn in stmtTrns)
                {
                    var tx = BuildOfxTransaction(statementId,
                        trn.Element("DTPOSTED")?.Value,
                        trn.Element("TRNAMT")?.Value,
                        trn.Element("NAME")?.Value ?? trn.Element("MEMO")?.Value ?? "",
                        trn.Element("FITID")?.Value ?? trn.Element("CHECKNUM")?.Value);
                    if (tx != null) transactions.Add(tx);
                }
                return transactions;
            }
            catch { /* fall through to SGML parser */ }
        }

        // OFX 1.x (SGML) — line-based parsing
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        string? date = null, amount = null, name = null, fitid = null;
        var inTrn = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (line.Equals("<STMTTRN>", StringComparison.OrdinalIgnoreCase)) { inTrn = true; continue; }
            if (line.Equals("</STMTTRN>", StringComparison.OrdinalIgnoreCase))
            {
                inTrn = false;
                var tx = BuildOfxTransaction(statementId, date, amount, name ?? "", fitid);
                if (tx != null) transactions.Add(tx);
                date = amount = name = fitid = null;
                continue;
            }
            if (!inTrn) continue;

            var val = ExtractOfxValue(line);
            if (line.StartsWith("<DTPOSTED>", StringComparison.OrdinalIgnoreCase)) date = val;
            else if (line.StartsWith("<TRNAMT>", StringComparison.OrdinalIgnoreCase)) amount = val;
            else if (line.StartsWith("<NAME>", StringComparison.OrdinalIgnoreCase)) name = val;
            else if (line.StartsWith("<MEMO>", StringComparison.OrdinalIgnoreCase)) name ??= val;
            else if (line.StartsWith("<FITID>", StringComparison.OrdinalIgnoreCase)) fitid = val;
            else if (line.StartsWith("<CHECKNUM>", StringComparison.OrdinalIgnoreCase)) fitid ??= val;
        }

        return transactions;
    }

    private static BankTransaction? BuildOfxTransaction(Guid statementId, string? dateStr, string? amountStr, string label, string? reference)
    {
        if (!TryParseOfxDate(dateStr, out var date)) return null;
        if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount)) return null;

        return new BankTransaction
        {
            BankStatementId = statementId,
            Date = DateTime.SpecifyKind(date, DateTimeKind.Utc),
            Amount = amount,
            Label = label.Trim(),
            Reference = reference?.Trim()
        };
    }

    private static bool TryParseOfxDate(string? dateStr, out DateTime date)
    {
        date = default;
        if (string.IsNullOrWhiteSpace(dateStr)) return false;
        // OFX date format: YYYYMMDDHHMMSS[.XXX][±hh:mm]
        var clean = Regex.Replace(dateStr.Trim(), @"[\.\+\-]\d.*$", "");
        return DateTime.TryParseExact(clean.Length >= 8 ? clean[..8] : clean,
            "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out date);
    }

    private static string ExtractOfxValue(string line)
    {
        var gtIdx = line.IndexOf('>');
        if (gtIdx < 0) return line;
        var raw = line[(gtIdx + 1)..];
        var ltIdx = raw.IndexOf('<');
        return ltIdx >= 0 ? raw[..ltIdx] : raw;
    }

    private static List<BankTransaction> ParseCsv(string content, Guid statementId)
    {
        var transactions = new List<BankTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        // Auto-detect delimiter (comma or semicolon)
        var delimiter = DetectDelimiter(lines.FirstOrDefault() ?? "");

        // Detect header row and column indices
        int dateCol = 0, amountCol = 1, labelCol = 2, refCol = -1;
        int startRow = 0;

        if (lines.Length > 0)
        {
            var header = lines[0].Split(delimiter);
            for (int i = 0; i < header.Length; i++)
            {
                var h = header[i].Trim('"', ' ').ToLowerInvariant();
                if (h is "date" or "date opération" or "date operation") dateCol = i;
                else if (h is "montant" or "amount" or "debit" or "credit" or "débit" or "crédit") amountCol = i;
                else if (h is "libellé" or "libelle" or "label" or "description" or "motif") labelCol = i;
                else if (h is "référence" or "reference" or "ref" or "numéro" or "numero") refCol = i;
            }
            // Skip header if first cell looks like a date field name
            if (!DateTime.TryParse(header[dateCol].Trim('"', ' '), out _)) startRow = 1;
        }

        for (int i = startRow; i < lines.Length; i++)
        {
            var cols = SplitCsvLine(lines[i], delimiter);
            if (cols.Length <= Math.Max(dateCol, amountCol)) continue;

            var dateStr = cols[dateCol].Trim('"', ' ');
            var amountStr = cols[amountCol].Trim('"', ' ').Replace(" ", "").Replace(",", ".");
            var label = labelCol < cols.Length ? cols[labelCol].Trim('"', ' ') : "";
            var reference = refCol >= 0 && refCol < cols.Length ? cols[refCol].Trim('"', ' ') : null;

            if (!DateTime.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var date) &&
                !DateTime.TryParse(dateStr, new CultureInfo("fr-FR"), DateTimeStyles.AssumeUniversal, out date))
                continue;

            if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                continue;

            transactions.Add(new BankTransaction
            {
                BankStatementId = statementId,
                Date = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                Amount = amount,
                Label = label,
                Reference = string.IsNullOrWhiteSpace(reference) ? null : reference
            });
        }

        return transactions;
    }

    private static char DetectDelimiter(string line) =>
        line.Count(c => c == ';') > line.Count(c => c == ',') ? ';' : ',';

    private static string[] SplitCsvLine(string line, char delimiter)
    {
        var result = new List<string>();
        var inQuotes = false;
        var current = new System.Text.StringBuilder();
        foreach (var ch in line)
        {
            if (ch == '"') { inQuotes = !inQuotes; continue; }
            if (ch == delimiter && !inQuotes) { result.Add(current.ToString()); current.Clear(); continue; }
            current.Append(ch);
        }
        result.Add(current.ToString());
        return result.ToArray();
    }
}
