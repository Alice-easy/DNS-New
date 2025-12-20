import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allow cross-origin requests from your custom domain in development
  allowedDevOrigins: [
    "dns.unix.us.ci",
    "http://dns.unix.us.ci",
    "https://dns.unix.us.ci",
    "23.140.140.69",
  ],
};

export default withNextIntl(nextConfig);
