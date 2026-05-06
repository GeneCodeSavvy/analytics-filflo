import { Resend } from "resend";

export async function sendInviteMail(
  to: string[],
  inviterName: string,
  teamName: string,
  inviteLink: string,
  invitationId: string,
) {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is required to send invite email");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    {
      from,
      to,
      subject: `${inviterName} invited you to ${teamName} on Filflo`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border:1px solid #E8E6E0;border-radius:12px;padding:40px 36px;">
        <tr><td>
          <p style="margin:0 0 24px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b6375;">Team Invitation</p>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#08060d;line-height:1.2;">You're invited to join<br><span style="color:#c97a1a;">${teamName}</span></h1>
          <p style="margin:0 0 32px;font-size:14px;color:#6b6375;line-height:1.6;">${inviterName} invited you to collaborate on Filflo. Accept to start working together.</p>
          <a href="${inviteLink}" target="_blank" style="display:inline-block;padding:10px 24px;background:#c97a1a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;">Accept Invitation</a>
          <p style="margin:32px 0 0;font-size:11px;color:#6b6375;">This invite expires in 48 hours. If you weren't expecting this, ignore it.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    },
    {
      idempotencyKey: `team-invite/${invitationId}`,
    },
  );

  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
}

export async function sendBootstrapSuperAdminMail(
  to: string,
  displayName: string,
  teamName: string,
  signUpLink: string,
) {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is required to send bootstrap email");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    {
      from,
      to,
      subject: `Finish setting up ${teamName} on Filflo`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border:1px solid #E8E6E0;border-radius:12px;padding:40px 36px;">
        <tr><td>
          <p style="margin:0 0 24px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b6375;">Filflo Setup</p>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#08060d;line-height:1.2;">Your Super Admin account is ready</h1>
          <p style="margin:0 0 32px;font-size:14px;color:#6b6375;line-height:1.6;">Hi ${displayName}, finish creating your Clerk account with this email to access ${teamName} as the first Super Admin.</p>
          <a href="${signUpLink}" target="_blank" style="display:inline-block;padding:10px 24px;background:#c97a1a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;">Create Super Admin Account</a>
          <p style="margin:32px 0 0;font-size:11px;color:#6b6375;">Use the same email address that received this message so Filflo can link your account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
