// DNS 查询和监控检查模块

import dns from "dns/promises";

export type DNSRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT"
  | "NS"
  | "SRV"
  | "CAA"
  | "PTR";

export interface DNSCheckResult {
  status: "success" | "failed" | "partial";
  isAvailable: boolean;
  latency?: number; // ms
  isCorrect?: boolean;
  expectedValue: string;
  actualValue?: string;
  errorMessage?: string;
}

/**
 * Get the full DNS name for a record
 * @param recordName - Record name (@ for root, or subdomain)
 * @param domainName - Domain name (e.g., example.com)
 */
function getFullDNSName(recordName: string, domainName: string): string {
  if (recordName === "@" || recordName === domainName) {
    return domainName;
  }
  // If recordName already includes domain, return as is
  if (recordName.endsWith(domainName)) {
    return recordName;
  }
  return `${recordName}.${domainName}`;
}

/**
 * Normalize DNS result for comparison
 */
function normalizeResult(result: unknown): string[] {
  if (Array.isArray(result)) {
    // Flatten nested arrays (like TXT records)
    return result.flatMap((item) => {
      if (Array.isArray(item)) {
        return item.join("");
      }
      if (typeof item === "object" && item !== null) {
        // MX records
        if ("exchange" in item) {
          return (item as { exchange: string }).exchange;
        }
        // SRV records
        if ("name" in item) {
          return (item as { name: string }).name;
        }
        return JSON.stringify(item);
      }
      return String(item);
    });
  }
  return [String(result)];
}

/**
 * Check if actual result matches expected value
 */
function checkCorrectness(
  actualValues: string[],
  expectedValue: string,
  recordType: DNSRecordType
): boolean {
  // Normalize expected value (remove trailing dot if present)
  const normalizedExpected = expectedValue.replace(/\.$/, "").toLowerCase();

  // For some record types, we check if expected value is in the results
  return actualValues.some((actual) => {
    const normalizedActual = actual.replace(/\.$/, "").toLowerCase();
    return normalizedActual === normalizedExpected;
  });
}

/**
 * Resolve DNS record by type
 */
async function resolveDNS(
  hostname: string,
  recordType: DNSRecordType
): Promise<unknown> {
  switch (recordType) {
    case "A":
      return await dns.resolve4(hostname);
    case "AAAA":
      return await dns.resolve6(hostname);
    case "CNAME":
      return await dns.resolveCname(hostname);
    case "MX":
      return await dns.resolveMx(hostname);
    case "TXT":
      return await dns.resolveTxt(hostname);
    case "NS":
      return await dns.resolveNs(hostname);
    case "SRV":
      return await dns.resolveSrv(hostname);
    case "CAA":
      return await dns.resolveCaa(hostname);
    case "PTR":
      return await dns.resolvePtr(hostname);
    default:
      throw new Error(`Unsupported record type: ${recordType}`);
  }
}

/**
 * Check DNS record availability, latency, and correctness
 */
export async function checkDNSRecord(
  recordType: DNSRecordType,
  recordName: string,
  domainName: string,
  expectedValue: string,
  options?: {
    checkAvailability?: boolean;
    checkLatency?: boolean;
    checkCorrectness?: boolean;
    timeout?: number;
  }
): Promise<DNSCheckResult> {
  const {
    checkAvailability = true,
    checkLatency = true,
    checkCorrectness: doCheckCorrectness = true,
    timeout = 5000,
  } = options || {};

  const fullName = getFullDNSName(recordName, domainName);
  const startTime = Date.now();

  // Set custom DNS resolver timeout
  dns.setServers(["8.8.8.8", "1.1.1.1"]);

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("DNS query timeout")), timeout);
    });

    // Race between DNS query and timeout
    const result = await Promise.race([
      resolveDNS(fullName, recordType),
      timeoutPromise,
    ]);

    const latency = Date.now() - startTime;
    const actualValues = normalizeResult(result);
    const actualValue = actualValues.join(", ");

    const isCorrect = doCheckCorrectness
      ? checkCorrectness(actualValues, expectedValue, recordType)
      : undefined;

    return {
      status: isCorrect === false ? "partial" : "success",
      isAvailable: true,
      latency: checkLatency ? latency : undefined,
      isCorrect,
      expectedValue,
      actualValue,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Determine if it's a "not found" error (NXDOMAIN) vs actual failure
    const isNotFound =
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("ENODATA") ||
      errorMessage.includes("SERVFAIL");

    return {
      status: "failed",
      isAvailable: false,
      latency: checkLatency ? latency : undefined,
      isCorrect: false,
      expectedValue,
      errorMessage: isNotFound
        ? `DNS record not found: ${fullName}`
        : errorMessage,
    };
  }
}

/**
 * Batch check multiple DNS records
 */
export async function batchCheckDNSRecords(
  records: Array<{
    id: string;
    type: DNSRecordType;
    name: string;
    domainName: string;
    content: string;
  }>,
  options?: {
    checkAvailability?: boolean;
    checkLatency?: boolean;
    checkCorrectness?: boolean;
    concurrency?: number;
  }
): Promise<Map<string, DNSCheckResult>> {
  const { concurrency = 5, ...checkOptions } = options || {};
  const results = new Map<string, DNSCheckResult>();

  // Process in batches to limit concurrency
  for (let i = 0; i < records.length; i += concurrency) {
    const batch = records.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (record) => {
        const result = await checkDNSRecord(
          record.type,
          record.name,
          record.domainName,
          record.content,
          checkOptions
        );
        return { id: record.id, result };
      })
    );

    for (const { id, result } of batchResults) {
      results.set(id, result);
    }
  }

  return results;
}
