"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { type Locale, locales } from "@/i18n/routing";

export async function setLocaleCookie(locale: Locale) {
  // Validate locale
  if (!locales.includes(locale)) {
    throw new Error("Invalid locale");
  }

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // Revalidate all pages to reflect the new locale
  revalidatePath("/", "layout");
}

export async function getLocaleCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value as Locale | undefined;
  return locale && locales.includes(locale) ? locale : "en";
}
