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
import { NamecheapProvider } from "./namecheap";
import { GoDaddyProvider } from "./godaddy";
import { HuaweiCloudDNSProvider } from "./huaweicloud";
import { Route53Provider } from "./route53";

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

// Register Namecheap provider
providerRegistry.set("namecheap", {
  meta: new NamecheapProvider({
    apiUser: "dummy",
    apiKey: "dummy",
    userName: "dummy",
    clientIp: "0.0.0.0",
  }).meta,
  factory: (credentials) => new NamecheapProvider(credentials),
});

// Register GoDaddy provider
providerRegistry.set("godaddy", {
  meta: new GoDaddyProvider({ apiKey: "dummy", apiSecret: "dummy" }).meta,
  factory: (credentials) => new GoDaddyProvider(credentials),
});

// Register Huawei Cloud DNS provider
providerRegistry.set("huaweicloud", {
  meta: new HuaweiCloudDNSProvider({
    accessKeyId: "dummy",
    secretAccessKey: "dummy",
  }).meta,
  factory: (credentials) => new HuaweiCloudDNSProvider(credentials),
});

// Register AWS Route53 provider
providerRegistry.set("route53", {
  meta: new Route53Provider({
    accessKeyId: "dummy",
    secretAccessKey: "dummy",
  }).meta,
  factory: (credentials) => new Route53Provider(credentials),
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
export { NamecheapProvider } from "./namecheap";
export { GoDaddyProvider } from "./godaddy";
export { HuaweiCloudDNSProvider } from "./huaweicloud";
export { Route53Provider } from "./route53";
