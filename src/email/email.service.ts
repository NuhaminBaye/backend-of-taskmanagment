import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    // Transporter will be created when needed with validated credentials
  }

  private getTransporter(): nodemailer.Transporter {
    // Validate credentials first
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");

    this.logger.log("SMTP_USER:", smtpUser);
    this.logger.log("SMTP_PASS exists:", !!smtpPass);

    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP credentials are not configured");
    }

    // Create transporter with validated credentials (similar to nodemailer example)
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,

        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Add debug option for troubleshooting
        debug: process.env.NODE_ENV === "development",
        logger: process.env.NODE_ENV === "development",
      });
    }

    return this.transporter;
  }

  private extractPlainText(html: string): string {
    const text = html
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    return text || "Please view this email in an HTML-capable email client.";
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      this.logger.log("SMTP server connection verified successfully");
      return true;
    } catch (error) {
      this.logger.error(
        `SMTP server connection verification failed: ${error.message}`,
      );
      return false;
    }
  }

  async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
  }) {
    try {
      if (!to || typeof to !== "string" || !to.includes("@")) {
        throw new Error(`Invalid email address: ${to}`);
      }

      const senderEmail = this.configService.get<string>("SENDER_EMAIL");
      if (!senderEmail) {
        throw new Error("SENDER_EMAIL environment variable is not set");
      }

      const transporter = this.getTransporter();

      this.logger.log(`Attempting to send email to: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`From: ${senderEmail}`);

      const plainText = this.extractPlainText(body);

      const mailOptions = {
        from: `"Task Management" <${senderEmail}>`,
        to: to,
        subject: subject,
        html: body,
        text: plainText,

        headers: {
          "X-Mailer": "Task Management System",
          "X-Priority": "3",
          Importance: "normal",
        },
      };

      // Send the email (using async/await instead of callback)
      const response = await transporter.sendMail(mailOptions);

      // Log successful send with message ID
      this.logger.log(
        `Email sent successfully to ${to}. Message ID: ${response.messageId}`,
      );
      this.logger.log(
        `Response: ${response.response || "No response message"}`,
      );

      // Log detailed response (similar to nodemailer example info object)
      this.logger.debug("Email response details:", {
        messageId: response.messageId,
        accepted: response.accepted,
        rejected: response.rejected,
        pending: response.pending,
        response: response.response,
      });

      // Check if email was actually accepted by SMTP server
      if (response.rejected && response.rejected.length > 0) {
        this.logger.error(`Email was rejected for: ${to}`, response.rejected);
        throw new Error(
          `Email was rejected by SMTP server: ${response.rejected.join(", ")}`,
        );
      }

      // Verify email was accepted
      if (response.accepted && response.accepted.length > 0) {
        this.logger.log(
          `Email accepted by SMTP server for: ${response.accepted.join(", ")}`,
        );
      }

      if (!response.messageId) {
        this.logger.warn(`Warning: No message ID returned for email to ${to}`);
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      this.logger.error("Error details:", error);

      // Re-throw error so caller can handle it
      throw error;
    }
  }
}
