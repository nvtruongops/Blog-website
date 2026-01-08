/**
 * Professional Email Template for ALL Blogs
 * Author: nvtruongops
 */

const APP_NAME = "ALL Blogs";
const PRIMARY_COLOR = "#2d5016";
const SECONDARY_COLOR = "#4a7c23";
const YEAR = new Date().getFullYear();

const baseTemplate = (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">${APP_NAME}</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Share your stories with the world</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px; color: #6c757d; font-size: 13px;">
                      © 2021-${YEAR} ${APP_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">
                      Made with ❤️ by <a href="https://github.com/nvtruongops" style="color: ${PRIMARY_COLOR}; text-decoration: none;">nvtruongops</a>
                    </p>
                    <p style="margin: 10px 0 0; color: #adb5bd; font-size: 11px;">
                      This is an automated message. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const codeBox = (code) => `
<div style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%); border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
  <p style="margin: 0 0 10px; color: rgba(255,255,255,0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
  <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px;">${code}</p>
</div>
`;

const button = (text, href = "#") => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 25px auto;">
  <tr>
    <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%); border-radius: 6px;">
      <a href="${href}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">${text}</a>
    </td>
  </tr>
</table>
`;

const infoBox = (items) => `
<div style="background-color: #f8f9fa; border-left: 4px solid ${PRIMARY_COLOR}; padding: 15px 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
  ${items.map(item => `<p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>${item.label}:</strong> ${item.value}</p>`).join('')}
</div>
`;

module.exports = {
  APP_NAME,
  PRIMARY_COLOR,
  baseTemplate,
  codeBox,
  button,
  infoBox
};
