/**
 * DNS Provider Registry
 * Factory for creating provider instances
 */

import {
  IDNSProvider,
  ProviderCredentials,
  ProviderMeta,
  DNSProviderFactory,
} from "./types";
import { CloudflareProvider } from "./cloudflare";
import { AliyunDNSProvider } from "./alidns";
import { DNSPodProvider } from "./dnspod";

// Provider registry
const providerRegistry: Map<
  string,
  {
    meta: ProviderMeta;
    factory: DNSProviderFactory;
  }
> = new Map();

// Register Cloudflare provider
providerRegistry.set("cloudflare", {
  meta: new CloudflareProvider({ apiToken: "dummy" }).meta,
  factory: (credentials) => new CloudflareProvider(credentials),
});

// Register Aliyun DNS provider
providerRegistry.set("alidns", {
  meta: new AliyunDNSProvider({ accessKeyId: "dummy", accessKeySecret: "dummy" }).meta,
  factory: (credentials) => new AliyunDNSProvider(credentials),
});

// Register DNSPod provider
providerRegistry.set("dnspod", {
  meta: new DNSPodProvider({ secretId: "dummy", secretKey: "dummy" }).meta,
  factory: (credentials) => new DNSPodProvider(credentials),
});

/**
 * Get all available provider metadata
 */
export function getAvailableProviders(): ProviderMeta[] {
  return Array.from(providerRegistry.values()).map((p) => p.meta);
}

/**
 * Get metadata for a specific provider
 */
export function getProviderMeta(name: string): ProviderMeta | undefined {
  return providerRegistry.get(name)?.meta;
}

/**
 * Create a provider instance
 */
export function createProvider(
  name: string,
  credentials: ProviderCredentials
): IDNSProvider {
  const provider = providerRegistry.get(name);
  if (!provider) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return provider.factory(credentials);
}

/**
 * Register a new provider (for future extensibility)
 */
export function registerProvider(
  name: string,
  meta: ProviderMeta,
  factory: DNSProviderFactory
): void {
  providerRegistry.set(name, { meta, factory });
}

// Re-export types
export * from "./types";
export { CloudflareProvider } from "./cloudflare";
export { AliyunDNSProvider } from "./alidns";
export { DNSPodProvider } from "./dnspod";
