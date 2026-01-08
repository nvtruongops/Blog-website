const nodemailer = require("nodemailer");
const keys = require("../config/keys");
const { APP_NAME, baseTemplate, button, infoBox } = require("./emailTemplate");

exports.sendReportMail = (email1, email2, name1, name2, reason, postid) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: keys.EMAIL_ID,
      pass: keys.PASS,
    },
  });

  // Email to Admin
  const adminContent = `
    <h2 style="margin: 0 0 20px; color: #212529; font-size: 22px; font-weight: 600;">
      🚨 New Report Received
    </h2>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hello <strong>Admin</strong>,
    </p>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      A new content report has been submitted and requires your attention.
    </p>
    ${infoBox([
      { label: "Reporter", value: `${name2} (${email2})` },
      { label: "Reported User", value: `${name1} (${email1})` },
      { label: "Post ID", value: postid },
      { label: "Reason", value: reason }
    ])}
    <p style="margin: 20px 0 0; color: #6c757d; font-size: 14px;">
      Please review this report and take appropriate action.
    </p>
  `;

  // Email to reported user
  const reportedUserContent = `
    <h2 style="margin: 0 0 20px; color: #212529; font-size: 22px; font-weight: 600;">
      Content Report Notice
    </h2>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hello <strong>${name1}</strong>,
    </p>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      We've received a report regarding one of your posts on ${APP_NAME}.
    </p>
    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.6;">
        <strong>Important:</strong> Our team will review the reported content. If it violates our community guidelines, it may be removed. Repeated violations could result in account restrictions.
      </p>
    </div>
    <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      If you believe this report was made in error, please reply to this email with your explanation.
    </p>
  `;

  // Email to reporter (confirmation)
  const reporterContent = `
    <h2 style="margin: 0 0 20px; color: #212529; font-size: 22px; font-weight: 600;">
      Report Received ✓
    </h2>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hello <strong>${name2}</strong>,
    </p>
    <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
      Thank you for helping keep ${APP_NAME} a safe and respectful community. We've received your report and our team will review it shortly.
    </p>
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #155724; font-size: 14px;">
        ✅ Your report has been successfully submitted and is being processed.
      </p>
    </div>
    <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      We take all reports seriously and will take appropriate action if the content violates our guidelines. Thank you for your patience.
    </p>
  `;

  const mailToAdmin = {
    from: `"${APP_NAME}" <${keys.EMAIL_ID}>`,
    to: keys.EMAIL_ID,
    subject: `[${APP_NAME}] 🚨 New Report - Post #${postid}`,
    html: baseTemplate(adminContent, `New report from ${name2} on post ${postid}`),
  };

  const mailToReportedUser = {
    from: `"${APP_NAME}" <${keys.EMAIL_ID}>`,
    to: email1,
    subject: `[${APP_NAME}] Notice: Your Content Has Been Reported`,
    html: baseTemplate(reportedUserContent, "Your content has been reported"),
  };

  const mailToReporter = {
    from: `"${APP_NAME}" <${keys.EMAIL_ID}>`,
    to: email2,
    subject: `[${APP_NAME}] Your Report Has Been Received`,
    html: baseTemplate(reporterContent, "Thank you for your report"),
  };

  transporter.sendMail(mailToAdmin, (error, info) => {
    if (error) console.error("Admin notification error:", error.message);
  });

  transporter.sendMail(mailToReportedUser, (error, info) => {
    if (error) console.error("Reported user notification error:", error.message);
  });

  transporter.sendMail(mailToReporter, (error, info) => {
    if (error) console.error("Reporter confirmation error:", error.message);
  });
};
