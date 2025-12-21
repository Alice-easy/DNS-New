"use server";

/**
 * Email Server Actions
 * Server-side email operations
 */

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { testEmailConfig } from "@/lib/email";

/**
 * Test email connection (admin only)
 */
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) {
    return { success: false, error: "Admin access required" };
  }

  return await testEmailConfig();
}
