using Myb.Payment;
using Xunit;

namespace Myb.Payment.Tests;

/// <summary>
/// P1 scenarios for BankStatementParser not yet covered by BankStatementParserTests.
/// PAY-PR-003: CSV with quoted fields containing the delimiter.
/// PAY-PR-004: Amount and date normalisation (French number formats, ISO dates).
/// </summary>
public class BankStatementParserP1Tests
{
    private readonly BankStatementParser _parser = new();
    private readonly Guid _id = Guid.NewGuid();

    // ── PAY-PR-003 ──────────────────────────────────────────────────────────
    // CSV fields enclosed in quotes that contain the separator must be split correctly.

    [Fact]
    public void ParseCsv_QuotedFieldContainingSemicolon_SplitsCorrectly()
    {
        const string csv = """
            Date;Libellé;Montant
            01/10/2026;"VIR SOCIETE; SARL DUPONT";450.00
            """;

        var result = _parser.Parse(csv, "CSV", _id);

        Assert.Single(result);
        Assert.Equal("VIR SOCIETE; SARL DUPONT", result[0].Label);
        Assert.Equal(450m, result[0].Amount);
    }

    [Fact]
    public void ParseCsv_QuotedFieldContainingComma_SplitsCorrectly()
    {
        const string csv = """
            date,label,montant
            2026-10-01,"Paiement charge, lot 12",199.00
            """;

        var result = _parser.Parse(csv, "CSV", _id);

        Assert.Single(result);
        Assert.Equal("Paiement charge, lot 12", result[0].Label);
        Assert.Equal(199m, result[0].Amount);
    }

    // ── PAY-PR-004 ──────────────────────────────────────────────────────────
    // Amount normalisation: French thousands separator (space or dot), French decimal comma.
    // Date parsing: dd/MM/yyyy and ISO 8601.

    [Theory]
    [InlineData("1 234,567", 1234.567)]   // French: space thousands sep, comma decimal
    [InlineData("1.234,56",  1234.56)]    // French: dot thousands sep, comma decimal
    [InlineData("-50.00",    -50.00)]     // Standard negative decimal
    [InlineData("500",       500)]        // Integer
    public void ParseCsv_NormalisesAmount(string rawAmount, double expected)
    {
        var csv = $"Date;Libellé;Montant\n01/10/2026;VIR TEST;{rawAmount}\n";

        var result = _parser.Parse(csv, "CSV", _id);

        Assert.Single(result);
        Assert.Equal((decimal)expected, result[0].Amount);
    }

    [Theory]
    [InlineData("01/10/2026", 2026, 10, 1)]   // dd/MM/yyyy
    [InlineData("2026-10-01", 2026, 10, 1)]   // ISO 8601
    public void ParseCsv_ParsesDateFormats(string rawDate, int year, int month, int day)
    {
        var csv = $"Date;Libellé;Montant\n{rawDate};VIR TEST;100.00\n";

        var result = _parser.Parse(csv, "CSV", _id);

        Assert.Single(result);
        Assert.Equal(new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Unspecified), result[0].Date.Date);
    }
}
