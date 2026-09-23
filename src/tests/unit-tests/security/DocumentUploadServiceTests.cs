using System.Text;
using Myb.Document.Services;

namespace Myb.Security.Tests;

public class DocumentUploadServiceTests
{
    private readonly DocumentUploadService _validator = new();

    [Fact]
    public void AcceptsPdfWhoseMimeAndSignatureMatch()
    {
        var data = DataUrl("application/pdf", "%PDF-1.7\nvalid");

        var result = _validator.Validate("invoice.pdf", data);

        Assert.Equal("application/pdf", result.ContentType);
        Assert.EndsWith(".pdf", result.StorageFileName);
        Assert.NotEqual("invoice.pdf", result.StorageFileName);
    }

    [Theory]
    [InlineData("payload.svg", "image/svg+xml")]
    [InlineData("payload.exe", "application/octet-stream")]
    [InlineData("invoice.pdf.exe", "application/octet-stream")]
    public void RejectsExtensionsOutsideAllowList(string fileName, string contentType) =>
        Assert.Throws<ArgumentException>(() => _validator.Validate(fileName, DataUrl(contentType, "MZ")));

    [Fact]
    public void RejectsSpoofedMimeType() =>
        Assert.Throws<ArgumentException>(() =>
            _validator.Validate("image.png", DataUrl("image/png", "%PDF-1.7")));

    [Fact]
    public void RejectsAntivirusTestSignature()
    {
        const string eicar = "%PDF-X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!";
        Assert.Throws<ArgumentException>(() =>
            _validator.Validate("malware.pdf", DataUrl("application/pdf", eicar)));
    }

    [Fact]
    public void RejectsPathTraversalInFileName() =>
        Assert.Throws<ArgumentException>(() =>
            _validator.Validate("../invoice.pdf", DataUrl("application/pdf", "%PDF-1.7")));

    private static string DataUrl(string contentType, string content) =>
        $"data:{contentType};base64,{Convert.ToBase64String(Encoding.ASCII.GetBytes(content))}";
}
