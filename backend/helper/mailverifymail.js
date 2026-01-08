const nodemailer = require("nodemailer");
const keys = require("../config/keys");
const { APP_NAME, baseTemplate, codeBox } = require("./emailTemplate");

const isProduction = process.env.NODE_ENV === 'production';

exports.sendVerifyCode = (email, name, code) => {
  // Only log in development (avoid exposing sensitive data in production)
  if (!isProduction) {
    console.log("[EMAIL] Sending verification to:", email);
  }
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: keys.EMAIL_ID,
      pass: keys.PASS,
    },
  });

  const content = `
    <h2 style="margin: 0 0 20px; color: #212529; font-size: 22px; font-weight: 600;">
      Verify Your Email Address
    </h2>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      Welcome to ${APP_NAME}! To complete your registration and start sharing your stories, please verify your email address using the code below:
    </p>
    ${codeBox(code)}
    <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; line-height: 1.6;">
      This code will expire in <strong>10 minutes</strong> for security reasons.
    </p>
    <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
    </p>
  `;

  const mailOptions = {
    from: `"${APP_NAME}" <${keys.EMAIL_ID}>`,
    to: email,
    subject: `[${APP_NAME}] Verify Your Email Address`,
    html: baseTemplate(content, `Your verification code is: ${code}`),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("[EMAIL] Verification email failed:", error.message);
    } else if (!isProduction) {
      console.log("[EMAIL] Verification email sent successfully");
    }
  });
};
