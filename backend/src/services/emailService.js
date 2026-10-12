const nodemailer = require("nodemailer");
const config = require("../config/env");
const logger = require("../utils/logger");

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    requireTLS: config.smtpPort !== 465,
    auth:
      config.smtpUsername && config.smtpPassword
        ? { user: config.smtpUsername, pass: config.smtpPassword }
        : undefined,
  });
}

// Sends one email. Returns true on success, false if SMTP is not configured or sending failed.
async function sendMail({ to, subject, text, html, replyTo, attachments }) {
  if (!config.smtpHost) {
    logger.warning(`Email "${subject}" to ${to} not sent: SMTP is not configured`);
    return false;
  }
  try {
    await createTransporter().sendMail({
      from: config.smtpFrom,
      to,
      subject,
      text,
      html,
      replyTo,
      attachments,
    });
    return true;
  } catch (e) {
    logger.error(`Email "${subject}" to ${to} failed: ${e.message}`);
    return false;
  }
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${config.frontendUrl.replace(/\/$/, "")}/login?reset_token=${token}`;

  if (!config.smtpHost) {
    logger.info(`Password reset requested for ${email}; SMTP is not configured`);
    return false;
  }

  return sendMail({
    to: email,
    subject: "Reset your EEC portal password",
    text: `We received a request to reset your EEC portal password.\n\nReset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email.`,
  });
}

module.exports = { sendMail, sendPasswordResetEmail };
