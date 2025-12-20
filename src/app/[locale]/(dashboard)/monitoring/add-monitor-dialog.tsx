"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createMonitorTask } from "@/server/monitoring";

interface Record {
  id: string;
  type: string;
  name: string;
  content: string;
}

interface Domain {
  id: string;
  name: string;
}

interface AddMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: Domain[];
  availableRecords: Record[];
  selectedDomainId?: string;
}

export function AddMonitorDialog({
  open,
  onOpenChange,
  domains,
  availableRecords,
  selectedDomainId,
}: AddMonitorDialogProps) {
  const t = useTranslations("Monitoring");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [domainId, setDomainId] = useState(selectedDomainId || "");
  const [recordId, setRecordId] = useState("");
  const [checkAvailability, setCheckAvailability] = useState(true);
  const [checkLatency, setCheckLatency] = useState(true);
  const [checkCorrectness, setCheckCorrectness] = useState(true);
  const [checkInterval, setCheckInterval] = useState("300");

  const filteredRecords = availableRecords.filter(
    (r) => !domainId || availableRecords.some((ar) => ar.id === r.id)
  );

  const handleSubmit = () => {
    if (!domainId || !recordId) return;

    startTransition(async () => {
      const result = await createMonitorTask({
        domainId,
        recordId,
        checkInterval: parseInt(checkInterval),
        checkAvailability,
        checkLatency,
        checkCorrectness,
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addTask")}</DialogTitle>
          <DialogDescription>{t("addTaskDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Domain Select */}
          <div className="space-y-2">
            <Label>{t("domain")}</Label>
            <Select value={domainId} onValueChange={setDomainId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectDomain")} />
              </SelectTrigger>
              <SelectContent>
                {domains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Record Select */}
          <div className="space-y-2">
            <Label>{t("record")}</Label>
            <Select value={recordId} onValueChange={setRecordId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectRecord")} />
              </SelectTrigger>
              <SelectContent>
                {filteredRecords.map((record) => (
                  <SelectItem key={record.id} value={record.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{record.type}</Badge>
                      <span>{record.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Check Interval */}
          <div className="space-y-2">
            <Label>{t("checkInterval")}</Label>
            <Select value={checkInterval} onValueChange={setCheckInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">{t("interval1min")}</SelectItem>
                <SelectItem value="300">{t("interval5min")}</SelectItem>
                <SelectItem value="600">{t("interval10min")}</SelectItem>
                <SelectItem value="1800">{t("interval30min")}</SelectItem>
                <SelectItem value="3600">{t("interval1hour")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Check Options */}
          <div className="space-y-3">
            <Label>{t("checkOptions")}</Label>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t("checkAvailability")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("checkAvailabilityDesc")}
                </div>
              </div>
              <Switch
                checked={checkAvailability}
                onCheckedChange={setCheckAvailability}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t("checkLatency")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("checkLatencyDesc")}
                </div>
              </div>
              <Switch
                checked={checkLatency}
                onCheckedChange={setCheckLatency}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t("checkCorrectness")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("checkCorrectnessDesc")}
                </div>
              </div>
              <Switch
                checked={checkCorrectness}
                onCheckedChange={setCheckCorrectness}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!domainId || !recordId || isPending}
          >
            {isPending ? t("creating") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
