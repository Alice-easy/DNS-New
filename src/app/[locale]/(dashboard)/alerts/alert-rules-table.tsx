"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import { updateAlertRule, deleteAlertRule, type TriggerType } from "@/server/alerts";

interface AlertConditions {
  domainId?: string;
  recordId?: string;
  taskId?: string;
  threshold?: number;
  changeTypes?: string[];
}

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  conditions: AlertConditions;
  consecutiveFailures: number;
  cooldownMinutes: number;
  lastTriggeredAt: Date | null;
  channels: { channelId: string; channelName: string; channelType: string }[];
}

interface AlertRulesTableProps {
  rules: AlertRule[];
}

function getTriggerIcon(type: string) {
  switch (type) {
    case "monitor_failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "monitor_latency":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "record_changed":
      return <Zap className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

export function AlertRulesTable({ rules }: AlertRulesTableProps) {
  const t = useTranslations("Alerts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggleEnabled = (ruleId: string, enabled: boolean) => {
    startTransition(async () => {
      await updateAlertRule(ruleId, { enabled });
      router.refresh();
    });
  };

  const handleDelete = (ruleId: string) => {
    startTransition(async () => {
      await deleteAlertRule(ruleId);
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("ruleName")}</TableHead>
            <TableHead>{t("triggerType")}</TableHead>
            <TableHead>{t("channels")}</TableHead>
            <TableHead>{t("lastTriggered")}</TableHead>
            <TableHead className="w-20">{t("enabled")}</TableHead>
            <TableHead className="w-12">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">{rule.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTriggerIcon(rule.triggerType)}
                  <span className="text-sm">
                    {t(`trigger${rule.triggerType.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")}` as "triggerMonitorFailed")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {rule.channels.map((channel) => (
                    <Badge key={channel.channelId} variant="secondary">
                      {channel.channelName}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {rule.lastTriggeredAt
                  ? new Date(rule.lastTriggeredAt).toLocaleString()
                  : t("never")}
              </TableCell>
              <TableCell>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => handleToggleEnabled(rule.id, checked)}
                  disabled={isPending}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
