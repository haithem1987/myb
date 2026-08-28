using System.Net;
using System.Text.RegularExpressions;
using Myb.Common.Messaging.Models;

namespace Myb.Mailer.Services;

/// <summary>
/// Applies the single MYB email envelope to every message, regardless of the
/// service that published it. Keeping this at the delivery boundary also means
/// future producers automatically inherit the same responsive design.
/// </summary>
internal static partial class EmailTemplateRenderer
{
    private const string TemplateMarker = "data-myb-email-template=\"standard-v1\"";

    public static string Render(EmailMessage email, string brandName)
    {
        if (email.HtmlBody.Contains(TemplateMarker, StringComparison.OrdinalIgnoreCase))
        {
            return email.HtmlBody;
        }

        var content = ExtractBody(email.HtmlBody);
        var encodedSubject = WebUtility.HtmlEncode(email.Subject);
        var encodedBrand = WebUtility.HtmlEncode(brandName);
        var year = DateTime.UtcNow.Year;

        return $$"""
            <!doctype html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta name="color-scheme" content="light">
                <style>
                  body { margin: 0; padding: 0; background: #f3f6fb; color: #243247; font-family: Arial, Helvetica, sans-serif; }
                  .myb-content h1, .myb-content h2 { color: #173b75 !important; line-height: 1.25; }
                  .myb-content p { line-height: 1.6; }
                  .myb-content table { max-width: 100%; }
                  .myb-content a { color: #1d5fd1; }
                  @media only screen and (max-width: 680px) {
                    .myb-shell { width: 100% !important; border-radius: 0 !important; }
                    .myb-header, .myb-content, .myb-footer { padding-left: 22px !important; padding-right: 22px !important; }
                  }
                </style>
              </head>
              <body>
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{encodedSubject}}</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#f3f6fb;padding:32px 12px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" class="myb-shell" width="640" cellpadding="0" cellspacing="0" {{TemplateMarker}} style="width:640px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 28px rgba(23,59,117,.10);">
                        <tr>
                          <td class="myb-header" style="padding:28px 36px;background:#173b75;border-bottom:4px solid #3f83f8;">
                            <div style="font-size:25px;line-height:1;font-weight:800;letter-spacing:.08em;color:#ffffff;">{{encodedBrand}}</div>
                            <div style="margin-top:8px;font-size:13px;line-height:1.4;color:#cfe0ff;">Manage Your Business</div>
                          </td>
                        </tr>
                        <tr>
                          <td class="myb-content" style="padding:34px 36px;font-size:15px;line-height:1.6;color:#243247;">
                            {{content}}
                          </td>
                        </tr>
                        <tr>
                          <td class="myb-footer" style="padding:20px 36px;background:#f8fafc;border-top:1px solid #e5eaf2;text-align:center;color:#778398;font-size:12px;line-height:1.5;">
                            <div>{{encodedBrand}} · Manage Your Business</div>
                            <div style="margin-top:4px;">© {{year}} {{encodedBrand}}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """;
    }

    public static string ToPlainText(string html)
    {
        var content = ExtractBody(html);
        content = BlockBreakRegex().Replace(content, Environment.NewLine);
        content = TagRegex().Replace(content, string.Empty);
        content = WebUtility.HtmlDecode(content);
        return RepeatedBlankLineRegex().Replace(content, $"{Environment.NewLine}{Environment.NewLine}").Trim();
    }

    private static string ExtractBody(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        var bodyMatch = BodyRegex().Match(html);
        return bodyMatch.Success ? bodyMatch.Groups["content"].Value.Trim() : html.Trim();
    }

    [GeneratedRegex("<body\\b[^>]*>(?<content>[\\s\\S]*?)</body>", RegexOptions.IgnoreCase)]
    private static partial Regex BodyRegex();

    [GeneratedRegex("<(br|/p|/div|/tr|/h[1-6])\\b[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex BlockBreakRegex();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex TagRegex();

    [GeneratedRegex("(\\r?\\n)[ \\t]*(\\r?\\n)(?:[ \\t]*\\r?\\n)+")]
    private static partial Regex RepeatedBlankLineRegex();
}
