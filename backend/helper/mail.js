const nodemailer = require("nodemailer");
const keys = require("../config/keys");
const { APP_NAME, baseTemplate, codeBox } = require("./emailTemplate");

exports.sendResetCode = (email, name, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: keys.EMAIL_ID,
      pass: keys.PASS,
    },
  });

  const content = `
    <h2 style="margin: 0 0 20px; color: #212529; font-size: 22px; font-weight: 600;">
      Reset Your Password
    </h2>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password for your ${APP_NAME} account. Use the code below to complete the process:
    </p>
    ${codeBox(code)}
    <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; line-height: 1.6;">
      This code will expire in <strong>10 minutes</strong> for security reasons.
    </p>
    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        ⚠️ <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"${APP_NAME}" <${keys.EMAIL_ID}>`,
    to: email,
    subject: `[${APP_NAME}] Password Reset Request`,
    html: baseTemplate(content, `Your password reset code is: ${code}`),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Password reset email error:", error.message);
    } else {
      console.log("Password reset email sent:", info.response);
    }
  });
};
