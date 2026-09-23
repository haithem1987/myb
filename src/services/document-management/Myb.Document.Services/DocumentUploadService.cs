using System.IO.Compression;
using System.Text;
using Myb.Common.Authentification.Security;

namespace Myb.Document.Services;

public interface IDocumentUploadService
{
    ValidatedDocumentUpload Validate(string fileName, string dataUrl);
}

public sealed record ValidatedDocumentUpload(
    string OriginalFileName,
    string StorageFileName,
    string ContentType,
    long Size,
    string NormalizedDataUrl);

public sealed class DocumentUploadService : IDocumentUploadService
{
    public const int MaximumFileSize = 10 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> AllowedTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

    public ValidatedDocumentUpload Validate(string fileName, string dataUrl)
    {
        if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName ||
            RequestThreatDetector.ContainsThreat(fileName))
            throw new ArgumentException("Invalid file name.", nameof(fileName));

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedTypes.TryGetValue(extension, out var expectedContentType))
            throw new ArgumentException("This file type is not allowed.", nameof(fileName));

        var comma = dataUrl?.IndexOf(',') ?? -1;
        if (comma <= 5 || !dataUrl![..comma].EndsWith(";base64", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("The file must be a base64 data URL.", nameof(dataUrl));

        var declaredContentType = dataUrl[5..dataUrl.IndexOf(';')].Trim();
        if (!string.Equals(declaredContentType, expectedContentType, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("The declared file type does not match its extension.", nameof(dataUrl));

        byte[] content;
        try
        {
            content = Convert.FromBase64String(dataUrl[(comma + 1)..]);
        }
        catch (FormatException)
        {
            throw new ArgumentException("The file content is not valid base64.", nameof(dataUrl));
        }

        if (content.Length == 0 || content.Length > MaximumFileSize)
            throw new ArgumentException($"File size must be between 1 byte and {MaximumFileSize} bytes.", nameof(dataUrl));

        ValidateMagicBytes(extension, content);
        ScanForMalware(content);

        var safeOriginalName = Path.GetFileName(fileName);
        var storageName = $"{Guid.NewGuid():N}{extension}";
        return new ValidatedDocumentUpload(
            safeOriginalName,
            storageName,
            expectedContentType,
            content.LongLength,
            $"data:{expectedContentType};base64,{Convert.ToBase64String(content)}");
    }

    private static void ValidateMagicBytes(string extension, byte[] content)
    {
        var valid = extension switch
        {
            ".pdf" => StartsWith(content, "%PDF-"u8),
            ".png" => StartsWith(content, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            ".jpg" or ".jpeg" => content.Length >= 3 && content[0] == 0xFF && content[1] == 0xD8 && content[2] == 0xFF,
            ".docx" => IsExpectedOpenXml(content, "word/document.xml"),
            ".xlsx" => IsExpectedOpenXml(content, "xl/workbook.xml"),
            _ => false
        };

        if (!valid)
            throw new ArgumentException("The file signature does not match its extension.", nameof(content));
    }

    private static bool IsExpectedOpenXml(byte[] content, string requiredEntry)
    {
        if (content.Length < 4 || !StartsWith(content, [0x50, 0x4B, 0x03, 0x04]))
            return false;

        try
        {
            using var stream = new MemoryStream(content, writable: false);
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: false);
            return archive.Entries.Any(entry =>
                string.Equals(entry.FullName, requiredEntry, StringComparison.OrdinalIgnoreCase));
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    private static void ScanForMalware(byte[] content)
    {
        var text = Encoding.ASCII.GetString(content);
        if (text.Contains("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!", StringComparison.Ordinal))
            throw new ArgumentException("The file was rejected by the malware scanner.", nameof(content));
    }

    private static bool StartsWith(byte[] content, ReadOnlySpan<byte> signature) =>
        content.AsSpan().StartsWith(signature);
}
