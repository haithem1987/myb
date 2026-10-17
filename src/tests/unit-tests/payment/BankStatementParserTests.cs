using Myb.Payment;
using Xunit;

namespace Myb.Payment.Tests;

public class BankStatementParserTests
{
    private readonly BankStatementParser _parser = new();
    private readonly Guid _statementId = Guid.NewGuid();

    [Fact]
    public void ParseOfx_SgmlFormat_ExtractsTransactions()
    {
        const string ofx = """
            OFXHEADER:100
            DATA:OFXSGML

            <OFX>
            <BANKMSGSRSV1>
            <STMTTRNRS>
            <STMTRS>
            <BANKTRANLIST>
            <STMTTRN>
            <DTPOSTED>20261001
            <TRNAMT>-150.00
            <NAME>EDF ENERGIE
            <FITID>20261001001
            </STMTTRN>
            <STMTTRN>
            <DTPOSTED>20261005
            <TRNAMT>+500.00
            <NAME>VIR DUPONT JEAN
            <FITID>20261005001
            </STMTTRN>
            </BANKTRANLIST>
            </STMTRS>
            </STMTTRNRS>
            </BANKMSGSRSV1>
            </OFX>
            """;

        var result = _parser.Parse(ofx, "OFX", _statementId);

        Assert.Equal(2, result.Count);
        Assert.Equal(-150m, result[0].Amount);
        Assert.Equal("EDF ENERGIE", result[0].Label);
        Assert.Equal(500m, result[1].Amount);
        Assert.Equal("VIR DUPONT JEAN", result[1].Label);
        Assert.All(result, tx => Assert.Equal(_statementId, tx.BankStatementId));
    }

    [Fact]
    public void ParseCsv_SemicolonDelimited_ExtractsTransactions()
    {
        const string csv = """
            Date;Libellé;Montant
            01/10/2026;VIR MARTIN PAUL;300.00
            05/10/2026;PRELEVEMENT EDF;-89.50
            """;

        var result = _parser.Parse(csv, "CSV", _statementId);

        Assert.Equal(2, result.Count);
        Assert.Equal(300m, result[0].Amount);
        Assert.Equal("VIR MARTIN PAUL", result[0].Label);
        Assert.Equal(-89.50m, result[1].Amount);
    }

    [Fact]
    public void ParseCsv_CommaDelimited_ExtractsTransactions()
    {
        const string csv = """
            date,label,montant
            2026-10-01,Paiement charge,250.00
            """;

        var result = _parser.Parse(csv, "CSV", _statementId);

        Assert.Single(result);
        Assert.Equal(250m, result[0].Amount);
    }

    [Fact]
    public void ParseCsv_SkipsRowsWithInvalidAmountOrDate()
    {
        const string csv = """
            Date;Libellé;Montant
            invalid-date;VIR TEST;100.00
            01/10/2026;VIR VALIDE;200.00
            01/10/2026;MONTANT VIDE;
            """;

        var result = _parser.Parse(csv, "CSV", _statementId);

        Assert.Single(result);
        Assert.Equal(200m, result[0].Amount);
    }

    [Fact]
    public void Parse_UnsupportedFormat_Throws()
    {
        Assert.Throws<NotSupportedException>(() => _parser.Parse("", "XML", _statementId));
    }
}
