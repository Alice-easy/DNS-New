"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createRecord } from "@/server/records";
import { toast } from "sonner";
import type { DNSRecordType } from "@/lib/providers/types";

const RECORD_TYPES: DNSRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SRV",
  "CAA",
];

interface AddRecordDialogProps {
  domainId: string;
  domainName: string;
}

export function AddRecordDialog({ domainId, domainName }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordType, setRecordType] = useState<DNSRecordType>("A");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const ttl = parseInt(formData.get("ttl") as string) || 1;
    const priority = formData.get("priority")
      ? parseInt(formData.get("priority") as string)
      : undefined;
    const proxied = formData.get("proxied") === "on";

    try {
      const result = await createRecord(domainId, {
        type: recordType,
        name: name === "@" ? domainName : `${name}.${domainName}`,
        content,
        ttl,
        priority,
        proxied,
      });

      if (result.success) {
        toast.success("Record created successfully");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to create record");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  const showPriority = recordType === "MX" || recordType === "SRV";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add DNS Record</DialogTitle>
            <DialogDescription>
              Create a new DNS record for {domainName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Record Type */}
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={recordType}
                onValueChange={(v) => setRecordType(v as DNSRecordType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  name="name"
                  placeholder="@"
                  className="flex-1"
                />
                <span className="flex items-center text-sm text-muted-foreground">
                  .{domainName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use @ for the root domain
              </p>
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label htmlFor="content">
                {recordType === "A" || recordType === "AAAA"
                  ? "IP Address"
                  : recordType === "CNAME"
                    ? "Target"
                    : recordType === "MX"
                      ? "Mail Server"
                      : recordType === "TXT"
                        ? "Value"
                        : "Content"}
              </Label>
              <Input
                id="content"
                name="content"
                placeholder={
                  recordType === "A"
                    ? "192.0.2.1"
                    : recordType === "AAAA"
                      ? "2001:db8::1"
                      : recordType === "CNAME"
                        ? "example.com"
                        : recordType === "MX"
                          ? "mail.example.com"
                          : "value"
                }
                required
              />
            </div>

            {/* Priority (MX, SRV) */}
            {showPriority && (
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  placeholder="10"
                  min="0"
                  max="65535"
                />
              </div>
            )}

            {/* TTL */}
            <div className="grid gap-2">
              <Label htmlFor="ttl">TTL</Label>
              <Select name="ttl" defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Auto</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                  <SelectItem value="3600">1 hour</SelectItem>
                  <SelectItem value="86400">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Proxied (Cloudflare specific) */}
            {(recordType === "A" ||
              recordType === "AAAA" ||
              recordType === "CNAME") && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="proxied"
                  name="proxied"
                  className="h-4 w-4"
                />
                <Label htmlFor="proxied" className="font-normal">
                  Proxy through Cloudflare (orange cloud)
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
