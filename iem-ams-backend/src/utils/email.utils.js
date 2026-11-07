/**
 * src/utils/email.utils.js
 *
 * Handles automated email notifications using Nodemailer.
 *
 * Modes:
 * 1. Live Gmail / SMTP: When SMTP_USER and SMTP_PASS are set in .env
 * 2. Ethereal Test Mode: Fallback if no SMTP credentials are provided
 */

const nodemailer = require('nodemailer');

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || '').trim();
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;

  if (user && pass) {
    // Configured live SMTP (Gmail or custom SMTP)
    if (host.includes('gmail') || user.endsWith('@gmail.com')) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
      console.log(`[Email Service] Configured live Gmail SMTP with sender: ${user}`);
    } else {
      cachedTransporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
      console.log(`[Email Service] Configured live SMTP (${host}:${port}) with sender: ${user}`);
    }
  } else {
    // Fallback: Ethereal test inbox for development without live SMTP
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Email Service] Running in Test Mode via Ethereal Mailbox (${testAccount.user})`);
  }

  return cachedTransporter;
};

/**
 * Sends an admission decision email to the applicant's registered email address
 *
 * @param {Object} options
 * @param {string} options.to - Student's registered email
 * @param {string} options.studentName - Student's full name
 * @param {string} options.program - Course applied (e.g. B.Tech)
 * @param {'accepted'|'rejected'|'under_review'|'submitted'} options.status - New application status
 * @param {string} [options.remarks] - Administrator reviewer notes
 */
const sendAdmissionStatusEmail = async ({ to, studentName, program, status, remarks }) => {
  try {
    const transporter = await getTransporter();
    const user = (process.env.SMTP_USER || '').trim();

    let subject = '';
    let statusHeading = '';
    let statusColor = '#003366';
    let statusBadgeText = '';
    let bodyMessage = '';

    switch (status) {
      case 'accepted':
        subject = `🎉 Admission Selection Offer: ${program} at IEM Kolkata`;
        statusHeading = 'Congratulations! You Have Been Selected';
        statusColor = '#198754'; // Green
        statusBadgeText = 'SELECTION OFFER CONFIRMED';
        bodyMessage = `
          We are pleased to inform you that your application for admission to 
          <strong>${program}</strong> at the <strong>Institute of Engineering & Management (IEM), Kolkata</strong> 
          for the academic session 2026-27 has been <strong>ACCEPTED</strong> based on your academic merit and verification.
        `;
        break;

      case 'rejected':
        subject = `Admission Application Status: ${program} - IEM Kolkata`;
        statusHeading = 'Admission Application Status';
        statusColor = '#dc3545'; // Red
        statusBadgeText = 'NOT SELECTED';
        bodyMessage = `
          Thank you for your interest in the <strong>${program}</strong> program at the 
          <strong>Institute of Engineering & Management (IEM), Kolkata</strong>. 
          After careful evaluation of candidate applications, we regret to inform you that we are unable 
          to offer you admission for the upcoming academic session.
        `;
        break;

      case 'under_review':
        subject = `Application Update: ${program} Under Review - IEM Kolkata`;
        statusHeading = 'Application Under Review';
        statusColor = '#fd7e14'; // Orange
        statusBadgeText = 'UNDER VERIFICATION';
        bodyMessage = `
          Your application for <strong>${program}</strong> has been received and is currently 
          undergoing document verification and review by the IEM Admission Committee.
        `;
        break;

      default:
        subject = `Application Status Notification: ${program} - IEM Kolkata`;
        statusHeading = 'Application Update';
        statusColor = '#0d6efd';
        statusBadgeText = status.toUpperCase();
        bodyMessage = `Your admission application for <strong>${program}</strong> status has been updated.`;
    }

    const remarksBlock = remarks
      ? `
        <div style="background-color: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #333; display: block; margin-bottom: 5px;">Reviewer Notes & Remarks:</strong>
          <span style="color: #555; font-style: italic;">"${remarks}"</span>
        </div>
      `
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
          .header { background-color: #003366; color: #ffffff; padding: 25px 30px; text-align: center; }
          .content { padding: 30px; color: #333333; line-height: 1.6; }
          .status-badge { display: inline-block; background-color: ${statusColor}; color: #ffffff; font-size: 13px; font-weight: bold; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 15px; }
          .cta-btn { display: inline-block; background-color: #003366; color: #ffffff !important; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; margin-top: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 1px;">INSTITUTE OF ENGINEERING & MANAGEMENT</h2>
            <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.85;">Online Admission Management System (Kolkata)</p>
          </div>

          <div class="content">
            <div class="status-badge">${statusBadgeText}</div>
            <h3 style="color: ${statusColor}; margin-top: 0;">${statusHeading}</h3>
            
            <p>Dear <strong>${studentName}</strong>,</p>
            
            <p>${bodyMessage}</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #777;">Applicant Name:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${studentName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #777;">Registered Email:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${to}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #777;">Academic Program:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${program}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #777;">Current Status:</td>
                <td style="padding: 8px 0; font-weight: bold; color: ${statusColor}; text-align: right; text-transform: uppercase;">${status}</td>
              </tr>
            </table>

            ${remarksBlock}

            <p style="margin-top: 25px;">
              You can log in to your admission portal anytime to view your detailed dossier, submit documents, or track subsequent rounds.
            </p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:4200'}/student/dashboard" class="cta-btn">
                Visit IEM Admission Portal
              </a>
            </div>

            <p style="font-size: 13px; color: #666; margin-top: 30px;">
              Warm regards,<br>
              <strong>Admission Cell</strong><br>
              Institute of Engineering & Management (IEM), Kolkata<br>
              Sector V, Salt Lake, Kolkata &bull; admissions@iem.edu.in
            </p>
          </div>

          <div class="footer">
            This is an automated notification from the IEM Online Admission System.<br>
            Please do not reply directly to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    const sender = user ? `"IEM Admissions" <${user}>` : (process.env.EMAIL_FROM || '"IEM Admissions" <admissions@iem.edu.in>');

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      html: htmlContent,
      text: `Dear ${studentName},\n\nYour application for ${program} at IEM Kolkata status is now: ${status.toUpperCase()}.\n\n${remarks ? `Remarks: ${remarks}\n\n` : ''}Log in to your portal to view details: ${process.env.CLIENT_ORIGIN || 'http://localhost:4200'}\n\nIEM Kolkata Admission Cell`,
    });

    console.log(`[Email Service] ✅ Real email sent to ${to} (Message ID: ${info.messageId})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service] 🔗 Ethereal Email Preview URL: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendAdmissionStatusEmail };
