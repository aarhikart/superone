import nodemailer from "nodemailer";
import {
  renderContactNotificationEmail,
  renderContactAutoReplyEmail,
  renderPocNotificationEmail,
  renderPocAutoReplyEmail,
  renderJobNotificationEmail,
  renderJobAutoReplyEmail,
} from "./email-templates";

/**
 * Creates a Gmail SMTP Nodemailer transporter for a given account.
 * Uses Gmail SMTP configuration: host 'smtp.gmail.com', port 465, secure SSL.
 */
function createGmailTransporter(user, pass) {
  if (!user || !pass || pass === "your_app_password_here") {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for port 465
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Channel configuration getter
 */
function getChannelConfig(channel) {
  switch (channel) {
    case "contact": {
      const user = process.env.SMTP_CONTACT_USER || process.env.SMTP_USER || "contact@company.com";
      const pass = process.env.SMTP_CONTACT_PASS || process.env.SMTP_PASS;
      const to = process.env.SMTP_CONTACT_TO || user;
      return { user, pass, to };
    }
    case "sales": {
      const user = process.env.SMTP_SALES_USER || process.env.SMTP_USER || "sales@company.com";
      const pass = process.env.SMTP_SALES_PASS || process.env.SMTP_PASS;
      const to = process.env.SMTP_SALES_TO || user;
      return { user, pass, to };
    }
    case "hr": {
      const user = process.env.SMTP_HR_USER || process.env.SMTP_USER || "hr@company.com";
      const pass = process.env.SMTP_HR_PASS || process.env.SMTP_PASS;
      const to = process.env.SMTP_HR_TO || user;
      return { user, pass, to };
    }
    default:
      throw new Error(`Unknown email channel: ${channel}`);
  }
}

/**
 * Handles sending Contact Form Emails (Internal Notification & Auto-Reply)
 * 1. Contact Form -> contact@company.com
 * 2. Auto-reply from contact@company.com -> User
 * Subject format: New Contact Form Submission - Hitesh Patidar
 */
export async function sendContactEmails(data) {
  const { name, email } = data;
  const config = getChannelConfig("contact");
  const transporter = createGmailTransporter(config.user, config.pass);

  const subject = `New Contact Form Submission - ${name}`;

  if (!transporter) {
    console.warn(`[SMTP Warning] Contact Form email skipped: App Password not configured for ${config.user}. Set SMTP_CONTACT_PASS in .env.local.`);
    return { success: false, reason: "SMTP credentials unconfigured" };
  }

  try {
    // 1. Send Notification Email to Internal Team (contact@company.com)
    const notifPromise = transporter.sendMail({
      from: `"${name} via Contact Form" <${config.user}>`,
      to: config.to,
      replyTo: email,
      subject: subject,
      html: renderContactNotificationEmail(data),
    });

    // 2. Send Auto-Reply Confirmation Email to User
    const autoReplyPromise = transporter.sendMail({
      from: `"Company Contact Team" <${config.user}>`,
      to: email,
      subject: `Thank you for contacting us, ${name}`,
      html: renderContactAutoReplyEmail(data),
    });

    const [notifResult, autoReplyResult] = await Promise.all([notifPromise, autoReplyPromise]);
    console.log(`[SMTP Success] Contact emails dispatched for ${name} (${email}). Message IDs: ${notifResult.messageId}, ${autoReplyResult.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[SMTP Error] Failed to send contact emails for ${name}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Handles sending POC Request Emails (Internal Notification & Auto-Reply)
 * 1. POC Request Form -> sales@company.com
 * 2. Auto-reply from sales@company.com -> User
 * Subject format: New POC Request - Hitesh Patidar
 */
export async function sendPocEmails(data) {
  const { fullName, email, company } = data;
  const config = getChannelConfig("sales");
  const transporter = createGmailTransporter(config.user, config.pass);

  const subject = `New POC Request - ${fullName}`;

  if (!transporter) {
    console.warn(`[SMTP Warning] POC Request email skipped: App Password not configured for ${config.user}. Set SMTP_SALES_PASS in .env.local.`);
    return { success: false, reason: "SMTP credentials unconfigured" };
  }

  try {
    // 1. Send Notification Email to Sales Team (sales@company.com)
    const notifPromise = transporter.sendMail({
      from: `"${fullName} via POC Request" <${config.user}>`,
      to: config.to,
      replyTo: email,
      subject: subject,
      html: renderPocNotificationEmail(data),
    });

    // 2. Send Auto-Reply Confirmation Email to User
    const autoReplyPromise = transporter.sendMail({
      from: `"Sales Team" <${config.user}>`,
      to: email,
      subject: `POC Request Received - ${company}`,
      html: renderPocAutoReplyEmail(data),
    });

    const [notifResult, autoReplyResult] = await Promise.all([notifPromise, autoReplyPromise]);
    console.log(`[SMTP Success] POC emails dispatched for ${fullName} (${email}). Message IDs: ${notifResult.messageId}, ${autoReplyResult.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[SMTP Error] Failed to send POC emails for ${fullName}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Handles sending Job Application Emails (Internal Notification & Auto-Reply)
 * 1. Job Application -> hr@company.com
 * 2. Auto-reply from hr@company.com -> User
 * Subject format: New Job Application - Hitesh Patidar
 */
export async function sendJobApplicationEmails(data) {
  const { firstName, lastName, email, roleTitle } = data;
  const fullName = `${firstName} ${lastName}`.trim();
  const config = getChannelConfig("hr");
  const transporter = createGmailTransporter(config.user, config.pass);

  const subject = `New Job Application - ${fullName}`;

  if (!transporter) {
    console.warn(`[SMTP Warning] Job Application email skipped: App Password not configured for ${config.user}. Set SMTP_HR_PASS in .env.local.`);
    return { success: false, reason: "SMTP credentials unconfigured" };
  }

  try {
    // 1. Send Notification Email to HR Team (hr@company.com)
    const notifPromise = transporter.sendMail({
      from: `"${fullName} via Job Application" <${config.user}>`,
      to: config.to,
      replyTo: email,
      subject: subject,
      html: renderJobNotificationEmail(data),
    });

    // 2. Send Auto-Reply Confirmation Email to Applicant
    const autoReplyPromise = transporter.sendMail({
      from: `"HR Team" <${config.user}>`,
      to: email,
      subject: `Application Received - ${roleTitle}`,
      html: renderJobAutoReplyEmail(data),
    });

    const [notifResult, autoReplyResult] = await Promise.all([notifPromise, autoReplyPromise]);
    console.log(`[SMTP Success] Job Application emails dispatched for ${fullName} (${email}). Message IDs: ${notifResult.messageId}, ${autoReplyResult.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[SMTP Error] Failed to send Job Application emails for ${fullName}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Handles sending OTP emails for the Forgot Password flow.
 * Uses the default/contact SMTP channel configured in the project.
 */
export async function sendOtpEmail(email, otp) {
  const config = getChannelConfig("contact");
  const transporter = createGmailTransporter(config.user, config.pass);

  if (!transporter) {
    console.warn(`[SMTP Warning] OTP email skipped: App Password not configured for ${config.user}. Set SMTP_CONTACT_PASS in .env.local.`);
    return { success: false, reason: "SMTP credentials unconfigured" };
  }

  const subject = `Your Password Reset OTP`;
  const html = `
    <div style="font-family: sans-serif; padding: 30px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700; text-align: center;">Reset Your Password</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">You requested to reset your password. Use the following One-Time Password (OTP) to complete the verification. This OTP is valid for 10 minutes:</p>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-radius: 16px; margin: 24px 0; border: 1px solid #f1f5f9;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #06b6d4; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const result = await transporter.sendMail({
      from: `"Admin Dashboard" <${config.user}>`,
      to: email,
      subject: subject,
      html: html,
    });
    console.log(`[SMTP Success] OTP email sent to ${email}. Message ID: ${result.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[SMTP Error] Failed to send OTP email to ${email}:`, error);
    return { success: false, error: error.message };
  }
}

