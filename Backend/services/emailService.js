/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Milestone 14 — Email alerts for newly detected breaches.
 *
 *   • sendBreachAlertEmail(toEmail, monitoredEmail, newBreaches)
 *
 * Uses Nodemailer with SMTP configuration from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 * ─────────────────────────────────────────────────────────────────────────────
 */

import nodemailer from "nodemailer";

// ── Create reusable transporter from env vars ─────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false otherwise
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an HTML alert email listing newly detected breaches.
 *
 * @param {string}        toEmail        – Recipient (the user's login email)
 * @param {string}        monitoredEmail – The email address being monitored
 * @param {Array<Object>} newBreaches    – Array of newly inserted breach records
 *        Each record: { breachName, breachDate, description, source }
 */
async function sendBreachAlertEmail(toEmail, monitoredEmail, newBreaches) {
  if (!newBreaches || newBreaches.length === 0) return;

  const breachRows = newBreaches
    .map((b) => {
      const date = b.breachDate
        ? new Date(b.breachDate).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Unknown";
      const desc = b.description || "No description available";
      const exposed = b.source || "Not specified";

      return `
        <tr>
          <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0; font-weight:600; color:#1a202c;">
            ${b.breachName}
          </td>
          <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0; color:#4a5568;">
            ${date}
          </td>
          <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0; color:#4a5568;">
            ${desc}
          </td>
          <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0; color:#4a5568;">
            ${exposed}
          </td>
        </tr>`;
    })
    .join("");

  const htmlBody = `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"></head>
  <body style="margin:0; padding:0; background-color:#f7fafc; font-family:Arial, Helvetica, sans-serif;">
    <div style="max-width:680px; margin:32px auto; background:#ffffff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.08); overflow:hidden;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#e53e3e,#c53030); padding:28px 32px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:22px;">
          🚨 Breach Alert — New Data Breach Detected
        </h1>
      </div>

      <!-- Body -->
      <div style="padding:28px 32px;">
        <p style="font-size:15px; color:#2d3748; line-height:1.6;">
          We detected <strong>${newBreaches.length} new data breach(es)</strong>
          affecting your monitored email address:
        </p>
        <p style="font-size:16px; font-weight:700; color:#e53e3e; text-align:center; padding:8px 0;">
          ${monitoredEmail}
        </p>

        <!-- Breach Table -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border-collapse:collapse; margin:20px 0; border:1px solid #e2e8f0; border-radius:8px;">
          <thead>
            <tr style="background-color:#edf2f7;">
              <th style="padding:12px 16px; text-align:left; font-size:13px; color:#4a5568; text-transform:uppercase;">
                Breach Name
              </th>
              <th style="padding:12px 16px; text-align:left; font-size:13px; color:#4a5568; text-transform:uppercase;">
                Date
              </th>
              <th style="padding:12px 16px; text-align:left; font-size:13px; color:#4a5568; text-transform:uppercase;">
                Description
              </th>
              <th style="padding:12px 16px; text-align:left; font-size:13px; color:#4a5568; text-transform:uppercase;">
                Exposed Data
              </th>
            </tr>
          </thead>
          <tbody>
            ${breachRows}
          </tbody>
        </table>

        <!-- Security Recommendations -->
        <div style="background-color:#fffbeb; border-left:4px solid #ecc94b; padding:16px 20px; margin:24px 0; border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 8px 0; color:#975a16; font-size:15px;">
            🛡️ Security Recommendations
          </h3>
          <ul style="margin:0; padding-left:20px; color:#744210; font-size:14px; line-height:1.8;">
            <li>Change your password for the affected service(s) immediately.</li>
            <li>If you reuse that password elsewhere, change it on all other accounts too.</li>
            <li>Enable two-factor authentication (2FA) wherever possible.</li>
            <li>Monitor your bank and credit-card statements for suspicious activity.</li>
            <li>Be cautious of phishing emails that reference these breaches.</li>
            <li>Consider using a password manager to generate unique passwords.</li>
          </ul>
        </div>

        <p style="font-size:13px; color:#718096; text-align:center; margin-top:24px;">
          This is an automated alert from the <strong>Breach Monitoring System</strong>.<br>
          If you did not request monitoring for this email, please disregard this message.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color:#f7fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
        <p style="margin:0; font-size:12px; color:#a0aec0;">
          © ${new Date().getFullYear()} Breach Monitoring System &mdash; Keeping you safe online.
        </p>
      </div>

    </div>
  </body>
  </html>`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Breach Monitor" <noreply@breachmonitor.local>',
    to: toEmail,
    subject: `🚨 ${newBreaches.length} New Breach(es) Detected for ${monitoredEmail}`,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EmailService] ✓ Alert sent to ${toEmail} (messageId: ${info.messageId})`
    );
  } catch (emailErr) {
    console.error(
      `[EmailService] ✗ Failed to send alert to ${toEmail}:`,
      emailErr.message
    );
  }
}

export { sendBreachAlertEmail };
