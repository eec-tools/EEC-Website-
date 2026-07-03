const nodemailer = require("nodemailer");
const config = require("../config/env");
const logger = require("../utils/logger");

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${config.frontendUrl.replace(/\/$/, "")}/login?reset_token=${token}`;

  if (!config.smtpHost) {
    logger.info(`Password reset requested for ${email}; SMTP is not configured`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false,
      requireTLS: true,
      auth:
        config.smtpUsername && config.smtpPassword
          ? { user: config.smtpUsername, pass: config.smtpPassword }
          : undefined,
    });

    await transporter.sendMail({
      from: config.smtpFrom,
      to: email,
      subject: "Reset your EEC portal password",
      text: `We received a request to reset your EEC portal password.\n\nReset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email.`,
    });
    return true;
  } catch (e) {
    logger.error(`Password reset email send failed for ${email}: ${e.message}`);
    return false;
  }
}

module.exports = { sendPasswordResetEmail };
