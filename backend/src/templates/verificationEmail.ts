export function verificationEmailTemplate(link: string): string {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f4f7; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td style="background:#4f46e5; padding:24px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:20px;">Verify your email</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px; color:#333333; font-size:15px; line-height:1.6;">
                <p>Thanks for signing up. Click the button below to verify your email address. This link expires in 15 minutes.</p>
                <div style="text-align:center; margin:32px 0;">
                  <a href="${link}" style="background:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-weight:bold; display:inline-block;">
                    Verify Email
                  </a>
                </div>
                <p style="color:#888888; font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
                <p style="color:#888888; font-size:13px; word-break:break-all;">Or paste this link in your browser: ${link}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}