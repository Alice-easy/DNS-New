/**
 * Email Service
 * 使用 nodemailer 发送邮件，支持验证码等功能
 */

import nodemailer from "nodemailer";
import { getConfig } from "@/server/system-config";
import { CONFIG_KEYS } from "@/lib/system-config-types";

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

/**
 * 获取邮件配置
 */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const [host, port, user, password, fromEmail, fromName] = await Promise.all([
      getConfig(CONFIG_KEYS.SMTP_HOST),
      getConfig(CONFIG_KEYS.SMTP_PORT),
      getConfig(CONFIG_KEYS.SMTP_USER),
      getConfig(CONFIG_KEYS.SMTP_PASSWORD),
      getConfig(CONFIG_KEYS.SMTP_FROM_EMAIL),
      getConfig(CONFIG_KEYS.SMTP_FROM_NAME),
    ]);

    if (!host || !user || !password) {
      return null;
    }

    return {
      host,
      port: parseInt(port || "465", 10),
      user,
      password,
      fromEmail: fromEmail || user,
      fromName: fromName || "DNS Manager",
    };
  } catch {
    return null;
  }
}

/**
 * 创建邮件传输器
 */
async function createTransporter() {
  const config = await getEmailConfig();
  if (!config) {
    throw new Error("Email not configured");
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // 465 使用 SSL，其他使用 STARTTLS
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

/**
 * 发送邮件
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getEmailConfig();
    if (!config) {
      return { success: false, error: "Email not configured" };
    }

    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text: text || subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * 生成6位验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  locale: string = "zh-CN"
): Promise<{ success: boolean; error?: string }> {
  const isZh = locale.startsWith("zh");
  const isJa = locale.startsWith("ja");

  const subject = isZh
    ? "DNS Manager - 邮箱验证码"
    : isJa
      ? "DNS Manager - メール認証コード"
      : "DNS Manager - Email Verification Code";

  const expiresIn = isZh ? "10 分钟" : isJa ? "10 分" : "10 minutes";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo / Title -->
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">
                DNS Manager
              </h1>

              <!-- Message -->
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46; text-align: center;">
                ${isZh ? "您的邮箱验证码是：" : isJa ? "メール認証コード：" : "Your verification code is:"}
              </p>

              <!-- Code -->
              <div style="margin: 0 0 24px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: white; font-family: monospace;">
                  ${code}
                </span>
              </div>

              <!-- Expiry Notice -->
              <p style="margin: 0 0 24px; font-size: 14px; color: #71717a; text-align: center;">
                ${isZh ? `验证码将在 ${expiresIn} 后过期` : isJa ? `認証コードは ${expiresIn} で期限切れになります` : `This code will expire in ${expiresIn}`}
              </p>

              <!-- Security Notice -->
              <div style="padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 13px; color: #92400e;">
                  ${isZh ? "如果您没有请求此验证码，请忽略此邮件。" : isJa ? "このコードをリクエストしていない場合は、このメールを無視してください。" : "If you didn't request this code, please ignore this email."}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background: #f4f4f5; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                &copy; ${new Date().getFullYear()} DNS Manager
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * 测试邮件配置
 */
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * 检查邮箱验证是否启用
 */
export async function isEmailVerificationEnabled(): Promise<boolean> {
  try {
    const enabled = await getConfig(CONFIG_KEYS.EMAIL_VERIFICATION_ENABLED);
    return enabled === "true";
  } catch {
    return false;
  }
}
