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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createAlertRule, type TriggerType } from "@/server/alerts";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface AddRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: Channel[];
}

export function AddRuleDialog({ open, onOpenChange, channels }: AddRuleDialogProps) {
  const t = useTranslations("Alerts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("monitor_failed");
  const [consecutiveFailures, setConsecutiveFailures] = useState("1");
  const [cooldownMinutes, setCooldownMinutes] = useState("30");
  const [latencyThreshold, setLatencyThreshold] = useState("500");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!name || selectedChannels.length === 0) return;

    startTransition(async () => {
      const conditions: Record<string, unknown> = {};

      if (triggerType === "monitor_latency") {
        conditions.threshold = parseInt(latencyThreshold);
      }

      if (triggerType === "record_changed") {
        conditions.changeTypes = ["added", "modified", "deleted"];
      }

      const result = await createAlertRule({
        name,
        triggerType,
        conditions,
        consecutiveFailures: parseInt(consecutiveFailures),
        cooldownMinutes: parseInt(cooldownMinutes),
        channelIds: selectedChannels,
      });

      if (result.success) {
        onOpenChange(false);
        setName("");
        setTriggerType("monitor_failed");
        setSelectedChannels([]);
        router.refresh();
      }
    });
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addRule")}</DialogTitle>
          <DialogDescription>{t("addRuleDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rule Name */}
          <div className="space-y-2">
            <Label>{t("ruleName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("ruleNamePlaceholder")}
            />
          </div>

          {/* Trigger Type */}
          <div className="space-y-2">
            <Label>{t("triggerType")}</Label>
            <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monitor_failed">{t("triggerMonitorFailed")}</SelectItem>
                <SelectItem value="monitor_latency">{t("triggerMonitorLatency")}</SelectItem>
                <SelectItem value="record_changed">{t("triggerRecordChanged")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Latency Threshold (only for monitor_latency) */}
          {triggerType === "monitor_latency" && (
            <div className="space-y-2">
              <Label>{t("latencyThreshold")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={latencyThreshold}
                  onChange={(e) => setLatencyThreshold(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">ms</span>
              </div>
            </div>
          )}

          {/* Consecutive Failures */}
          <div className="space-y-2">
            <Label>{t("consecutiveFailures")}</Label>
            <Select value={consecutiveFailures} onValueChange={setConsecutiveFailures}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("consecutiveFailuresDesc")}</p>
          </div>

          {/* Cooldown */}
          <div className="space-y-2">
            <Label>{t("cooldown")}</Label>
            <Select value={cooldownMinutes} onValueChange={setCooldownMinutes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">{t("cooldown5min")}</SelectItem>
                <SelectItem value="15">{t("cooldown15min")}</SelectItem>
                <SelectItem value="30">{t("cooldown30min")}</SelectItem>
                <SelectItem value="60">{t("cooldown1hour")}</SelectItem>
                <SelectItem value="360">{t("cooldown6hour")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("cooldownDesc")}</p>
          </div>

          {/* Notification Channels */}
          <div className="space-y-2">
            <Label>{t("selectChannels")}</Label>
            {channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noChannelsHint")}</p>
            ) : (
              <div className="space-y-2">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={channel.id}
                      checked={selectedChannels.includes(channel.id)}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                    <label
                      htmlFor={channel.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {channel.name} ({channel.type})
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || selectedChannels.length === 0 || isPending}
          >
            {isPending ? t("creating") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
