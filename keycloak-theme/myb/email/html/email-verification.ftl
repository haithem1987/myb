<#import "template.ftl" as layout>
<@layout.emailLayout>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e7ecf4;border-radius:18px;overflow:hidden;box-shadow:0 12px 34px rgba(23,59,117,0.12);font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td style="padding:30px 36px;background:linear-gradient(135deg,#173b75 0%,#315fc5 100%);text-align:center;">
        <div style="font-size:28px;font-weight:800;letter-spacing:0.02em;color:#ffffff;">MYB Copropriété</div>
        <div style="margin-top:7px;font-size:14px;color:#dbe8ff;">Manage Your Business</div>
      </td>
    </tr>
    <tr>
      <td style="padding:36px;color:#27364b;">
        <h1 style="margin:0 0 18px;color:#173b75;font-size:25px;line-height:1.3;">${msg("emailVerificationGreeting", user.firstName!"")}</h1>
        <p style="margin:0 0 22px;font-size:16px;line-height:1.65;">${msg("emailVerificationIntro")}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;border-collapse:separate;border-spacing:0;background:#f4f7fc;border:1px solid #dce5f3;border-radius:10px;">
          <tr>
            <td style="padding:14px 16px;color:#64748b;font-size:13px;font-weight:700;">${msg("emailVerificationAddressLabel")}</td>
          </tr>
          <tr>
            <td style="padding:0 16px 16px;color:#173b75;font-size:16px;font-weight:700;word-break:break-all;">${user.email}</td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
          <tr>
            <td align="center">
              <a href="${link}" style="display:inline-block;padding:14px 26px;background:#315fc5;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;border-radius:9px;box-shadow:0 6px 16px rgba(49,95,197,0.28);">${msg("emailVerificationButton")}</a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 10px;text-align:center;color:#64748b;font-size:13px;line-height:1.55;">${msg("emailVerificationExpiry", linkExpirationFormatter(linkExpiration))}</p>
        <p style="margin:0 0 28px;text-align:center;color:#64748b;font-size:13px;line-height:1.55;">${msg("emailVerificationIgnore")}</p>

        <div style="padding-top:24px;border-top:1px solid #e7ecf4;text-align:center;">
          <p style="margin:0 0 12px;color:#526175;font-size:14px;">${msg("emailVerificationAppPrompt")}</p>
          <a href="https://myb-platform.com/" style="color:#315fc5;font-size:14px;font-weight:700;text-decoration:underline;">${msg("emailVerificationAppButton")}</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e7ecf4;text-align:center;color:#7b8798;font-size:12px;line-height:1.5;">
        ${msg("emailVerificationFooter")}<br>
        © ${.now?string("yyyy")} MYB
      </td>
    </tr>
  </table>
</@layout.emailLayout>
