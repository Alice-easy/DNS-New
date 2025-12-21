"use server";

/**
 * Email Verification Server Actions
 * 邮箱验证相关的服务端操作
 */

import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import {
  sendVerificationEmail,
  generateVerificationCode,
  isEmailVerificationEnabled,
} from "@/lib/email";
import { headers } from "next/headers";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

// Token expiration time (10 minutes)
const TOKEN_EXPIRATION_MS = 10 * 60 * 1000;

// Result types
export type SendCodeResult = {
  success: boolean;
  error?: string;
};

export type VerifyCodeResult = {
  success: boolean;
  error?: string;
};

/**
 * Check if email verification is required
 */
export async function checkEmailVerificationRequired(): Promise<boolean> {
  return await isEmailVerificationEnabled();
}

/**
 * Send verification code to email
 */
export async function sendVerificationCode(
  email: string,
  locale: string = "zh-CN"
): Promise<SendCodeResult> {
  // Rate limiting
  const headersList = await headers();
  const clientIp = getClientIdentifier(headersList);
  const rateLimitKey = `email:${clientIp}:${email}`;

  // Use a stricter rate limit for sending emails
  const rateLimit = checkRateLimit("register", rateLimitKey, {
    ...RATE_LIMIT_CONFIGS.register,
    maxRequests: 3, // Only 3 emails per window
    windowMs: 5 * 60 * 1000, // 5 minutes
  });

  if (!rateLimit.success) {
    const retryMinutes = Math.ceil((rateLimit.retryAfterMs || 0) / 60000);
    return {
      success: false,
      error: `Too many attempts. Please try again in ${retryMinutes} minutes.`,
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Check if email already registered
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingUser) {
    return { success: false, error: "Email already registered" };
  }

  try {
    // Generate verification code
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    // Delete any existing tokens for this email
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email));

    // Store the new token
    await db.insert(verificationTokens).values({
      identifier: email,
      token: code,
      expires,
    });

    // Send the email
    const result = await sendVerificationEmail(email, code, locale);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send verification code:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

/**
 * Verify the code entered by user
 */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<VerifyCodeResult> {
  // Rate limiting for verification attempts
  const headersList = await headers();
  const clientIp = getClientIdentifier(headersList);
  const rateLimitKey = `verify:${clientIp}:${email}`;

  const rateLimit = checkRateLimit("login", rateLimitKey, {
    ...RATE_LIMIT_CONFIGS.login,
    maxRequests: 5, // 5 attempts per window
  });

  if (!rateLimit.success) {
    const retryMinutes = Math.ceil((rateLimit.retryAfterMs || 0) / 60000);
    return {
      success: false,
      error: `Too many attempts. Please try again in ${retryMinutes} minutes.`,
    };
  }

  // Validate inputs
  if (!email || !code) {
    return { success: false, error: "Email and code are required" };
  }

  // Clean the code (remove spaces)
  const cleanCode = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: "Invalid verification code format" };
  }

  try {
    // Find valid token
    const token = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, cleanCode),
        gt(verificationTokens.expires, new Date())
      ),
    });

    if (!token) {
      return { success: false, error: "Invalid or expired verification code" };
    }

    // Token is valid - delete it
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email));

    return { success: true };
  } catch (error) {
    console.error("Failed to verify code:", error);
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Get remaining time for existing verification code
 */
export async function getCodeExpirationTime(email: string): Promise<number | null> {
  const token = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      gt(verificationTokens.expires, new Date())
    ),
  });

  if (!token) {
    return null;
  }

  return token.expires.getTime() - Date.now();
}
