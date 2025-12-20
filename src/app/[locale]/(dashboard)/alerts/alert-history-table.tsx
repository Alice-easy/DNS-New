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
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
} from "lucide-react";
import { acknowledgeAlert } from "@/server/alerts";

interface AlertHistoryItem {
  id: string;
  ruleId: string;
  status: string;
  severity: string;
  title: string;
  message: string;
  domainId: string | null;
  domainName: string | null;
  recordId: string | null;
  taskId: string | null;
  triggerData: string | null;
  notificationsSent: number;
  notificationsFailed: number;
  triggeredAt: Date | null;
  resolvedAt: Date | null;
  acknowledgedAt: Date | null;
}

interface AlertHistoryTableProps {
  history: AlertHistoryItem[];
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string, t: ReturnType<typeof useTranslations<"Alerts">>) {
  switch (status) {
    case "triggered":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {t("statusTriggered")}
        </Badge>
      );
    case "acknowledged":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          {t("statusAcknowledged")}
        </Badge>
      );
    case "resolved":
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t("statusResolved")}
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

export function AlertHistoryTable({ history }: AlertHistoryTableProps) {
  const t = useTranslations("Alerts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAcknowledge = (alertId: string) => {
    startTransition(async () => {
      await acknowledgeAlert(alertId);
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t("severity")}</TableHead>
            <TableHead>{t("alertTitle")}</TableHead>
            <TableHead>{t("domain")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("notifications")}</TableHead>
            <TableHead>{t("triggeredAt")}</TableHead>
            <TableHead className="w-24">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>{getSeverityIcon(alert.severity)}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {alert.message}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {alert.domainName || "-"}
              </TableCell>
              <TableCell>{getStatusBadge(alert.status, t)}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <span className="text-green-600">{alert.notificationsSent}</span>
                  {alert.notificationsFailed > 0 && (
                    <>
                      {" / "}
                      <span className="text-red-600">{alert.notificationsFailed}</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {alert.triggeredAt
                  ? new Date(alert.triggeredAt).toLocaleString()
                  : "-"}
              </TableCell>
              <TableCell>
                {alert.status === "triggered" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={isPending}
                  >
                    {t("acknowledge")}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
