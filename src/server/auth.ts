"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Registration result type
export type RegisterResult = {
  success: boolean;
  error?: string;
};

// Login result type
export type LoginResult = {
  success: boolean;
  error?: string;
};

/**
 * Handle GitHub OAuth sign in
 */
export async function handleGitHubSignIn() {
  await signIn("github", { redirectTo: "/" });
}

/**
 * Handle user sign out
 */
export async function handleSignOut() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Register a new user with credentials
 */
export async function handleRegister(formData: FormData): Promise<RegisterResult> {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate required fields
  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Validate password length
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  // Validate username if provided
  if (username) {
    if (username.length < 3) {
      return { success: false, error: "Username must be at least 3 characters" };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { success: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
    }
  }

  try {
    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existingEmail) {
      return { success: false, error: "Email already registered" };
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      if (existingUsername) {
        return { success: false, error: "Username already taken" };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await db.insert(users).values({
      email,
      username: username || null,
      password: hashedPassword,
      name: username || email.split("@")[0],
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An error occurred during registration" };
  }
}

/**
 * Handle credentials sign in
 */
export async function handleCredentialsSignIn(formData: FormData): Promise<LoginResult> {
  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { success: false, error: "Email/username and password are required" };
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirectTo: "/",
    });
    return { success: true };
  } catch (error: unknown) {
    // NextAuth throws an error on failed login
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      // This is actually a successful redirect, re-throw it
      throw error;
    }
    return { success: false, error: "Invalid credentials" };
  }
}
