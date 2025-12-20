"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Records");
  const tCommon = useTranslations("Common");
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
        toast.success(t("recordCreated"));
        setOpen(false);
      } else {
        toast.error(result.error || t("recordCreateFailed"));
      }
    } catch {
      toast.error(t("recordCreateFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  const showPriority = recordType === "MX" || recordType === "SRV";

  function getContentLabel() {
    switch (recordType) {
      case "A":
      case "AAAA":
        return t("ipAddress");
      case "CNAME":
        return t("target");
      case "MX":
        return t("mailServer");
      case "TXT":
        return t("recordValue");
      default:
        return t("recordContent");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("addRecord")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("addRecordTitle")}</DialogTitle>
            <DialogDescription>
              {t("addRecordDesc", { domain: domainName })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Record Type */}
            <div className="grid gap-2">
              <Label>{tCommon("type")}</Label>
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
              <Label htmlFor="name">{tCommon("name")}</Label>
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
                {t("useAtForRoot")}
              </p>
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label htmlFor="content">{getContentLabel()}</Label>
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
                <Label htmlFor="priority">{tCommon("priority")}</Label>
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
              <Label htmlFor="ttl">{tCommon("ttl")}</Label>
              <Select name="ttl" defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("auto")}</SelectItem>
                  <SelectItem value="60">{t("ttl1min")}</SelectItem>
                  <SelectItem value="300">{t("ttl5min")}</SelectItem>
                  <SelectItem value="600">{t("ttl10min")}</SelectItem>
                  <SelectItem value="1800">{t("ttl30min")}</SelectItem>
                  <SelectItem value="3600">{t("ttl1hour")}</SelectItem>
                  <SelectItem value="86400">{t("ttl1day")}</SelectItem>
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
                  {t("proxyCloudflare")}
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
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createRecord")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
