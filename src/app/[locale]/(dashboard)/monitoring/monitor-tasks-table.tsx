"use client";

import { useState, useTransition } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Play,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  executeMonitorCheck,
  updateMonitorTask,
  deleteMonitorTask,
} from "@/server/monitoring";

interface MonitorResult {
  status: string;
  isAvailable: boolean | null;
  latency: number | null;
  isCorrect: boolean | null;
}

interface MonitorTask {
  id: string;
  domainName: string;
  recordType: string;
  recordName: string;
  recordContent: string;
  enabled: boolean;
  checkInterval: number;
  lastCheckAt: Date | null;
  lastResult: MonitorResult | null;
}

interface MonitorTasksTableProps {
  tasks: MonitorTask[];
}

function getStatusIcon(result: MonitorResult | null) {
  if (!result) {
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
  if (result.status === "success") {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (result.status === "partial") {
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function getStatusColor(result: MonitorResult | null) {
  if (!result) return "bg-gray-100 text-gray-800";
  if (result.status === "success") return "bg-green-100 text-green-800";
  if (result.status === "partial") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function MonitorTasksTable({ tasks }: MonitorTasksTableProps) {
  const t = useTranslations("Monitoring");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const handleToggleEnabled = (taskId: string, enabled: boolean) => {
    startTransition(async () => {
      await updateMonitorTask(taskId, { enabled });
      router.refresh();
    });
  };

  const handleRunCheck = (taskId: string) => {
    setRunningTaskId(taskId);
    startTransition(async () => {
      await executeMonitorCheck(taskId);
      setRunningTaskId(null);
      router.refresh();
    });
  };

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      await deleteMonitorTask(taskId);
      setDeleteTaskId(null);
      router.refresh();
    });
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">{t("status")}</TableHead>
              <TableHead>{t("domain")}</TableHead>
              <TableHead>{t("record")}</TableHead>
              <TableHead>{t("interval")}</TableHead>
              <TableHead>{t("latency")}</TableHead>
              <TableHead>{t("lastCheck")}</TableHead>
              <TableHead className="w-20">{t("enabled")}</TableHead>
              <TableHead className="w-20">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.lastResult)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{task.domainName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{task.recordType}</Badge>
                    <span className="text-sm">{task.recordName}</span>
                  </div>
                </TableCell>
                <TableCell>{formatInterval(task.checkInterval)}</TableCell>
                <TableCell>
                  {task.lastResult?.latency !== null &&
                  task.lastResult?.latency !== undefined ? (
                    <span
                      className={
                        task.lastResult.latency < 100
                          ? "text-green-600"
                          : task.lastResult.latency < 500
                          ? "text-yellow-600"
                          : "text-red-600"
                      }
                    >
                      {task.lastResult.latency}ms
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {task.lastCheckAt
                    ? new Date(task.lastCheckAt).toLocaleString()
                    : t("never")}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={task.enabled}
                    onCheckedChange={(checked) =>
                      handleToggleEnabled(task.id, checked)
                    }
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRunCheck(task.id)}
                      disabled={runningTaskId === task.id}
                    >
                      {runningTaskId === task.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTaskId}
        onOpenChange={() => setDeleteTaskId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTaskTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteTaskDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskId && handleDelete(deleteTaskId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
