// DNS 记录变更检测模块

import type { ProviderRecord } from "@/lib/providers/types";
import type { Record } from "@/lib/db/schema";

export type ChangeType = "added" | "modified" | "deleted";

export interface RecordChangeInfo {
  changeType: ChangeType;
  remoteId: string;
  recordType: string;
  recordName: string;
  previousValue?: {
    content: string;
    ttl: number;
    priority?: number | null;
    proxied?: boolean | null;
  };
  currentValue?: {
    content: string;
    ttl: number;
    priority?: number | null;
    proxied?: boolean | null;
  };
  changedFields?: string[];
  localRecordId?: string;
}

/**
 * Compare two record values to check if they are equal
 */
function areRecordValuesEqual(
  local: Record,
  remote: ProviderRecord
): boolean {
  return (
    local.content === remote.content &&
    local.ttl === remote.ttl &&
    local.priority === (remote.priority ?? null) &&
    local.proxied === (remote.proxied ?? false)
  );
}

/**
 * Get list of changed fields between local and remote record
 */
function getChangedFields(local: Record, remote: ProviderRecord): string[] {
  const changed: string[] = [];

  if (local.content !== remote.content) changed.push("content");
  if (local.ttl !== remote.ttl) changed.push("ttl");
  if (local.priority !== (remote.priority ?? null)) changed.push("priority");
  if (local.proxied !== (remote.proxied ?? false)) changed.push("proxied");

  return changed;
}

/**
 * Detect DNS record changes between local and remote records
 *
 * @param localRecords - Current local DNS records
 * @param remoteRecords - Remote DNS records from provider
 * @returns Array of detected changes (added, modified, deleted)
 */
export function detectRecordChanges(
  localRecords: Record[],
  remoteRecords: ProviderRecord[]
): RecordChangeInfo[] {
  const changes: RecordChangeInfo[] = [];

  // Create local record map (key: remoteId)
  const localMap = new Map<string, Record>();
  for (const record of localRecords) {
    localMap.set(record.remoteId, record);
  }

  // Create remote record map (key: id)
  const remoteMap = new Map<string, ProviderRecord>();
  for (const record of remoteRecords) {
    remoteMap.set(record.id, record);
  }

  // Detect added and modified records
  for (const remote of remoteRecords) {
    const local = localMap.get(remote.id);

    if (!local) {
      // Added record
      changes.push({
        changeType: "added",
        remoteId: remote.id,
        recordType: remote.type,
        recordName: remote.name,
        currentValue: {
          content: remote.content,
          ttl: remote.ttl,
          priority: remote.priority ?? null,
          proxied: remote.proxied ?? false,
        },
      });
    } else if (!areRecordValuesEqual(local, remote)) {
      // Modified record
      changes.push({
        changeType: "modified",
        remoteId: remote.id,
        recordType: remote.type,
        recordName: remote.name,
        localRecordId: local.id,
        previousValue: {
          content: local.content,
          ttl: local.ttl,
          priority: local.priority,
          proxied: local.proxied,
        },
        currentValue: {
          content: remote.content,
          ttl: remote.ttl,
          priority: remote.priority ?? null,
          proxied: remote.proxied ?? false,
        },
        changedFields: getChangedFields(local, remote),
      });
    }
  }

  // Detect deleted records
  for (const local of localRecords) {
    if (!remoteMap.has(local.remoteId)) {
      changes.push({
        changeType: "deleted",
        remoteId: local.remoteId,
        recordType: local.type,
        recordName: local.name,
        localRecordId: local.id,
        previousValue: {
          content: local.content,
          ttl: local.ttl,
          priority: local.priority,
          proxied: local.proxied,
        },
      });
    }
  }

  return changes;
}
