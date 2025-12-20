import { defineRouting } from "next-intl/routing";

export const locales = ["en", "zh-CN", "ja"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  ja: "日本語",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed", // Only show locale in URL for non-default locales
});
