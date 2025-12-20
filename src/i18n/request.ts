import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing, type Locale } from "./routing";

export default getRequestConfig(async () => {
  // Get locale from cookie, default to 'en'
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;

  // Validate locale
  const locale: Locale = routing.locales.includes(localeCookie as Locale)
    ? (localeCookie as Locale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
