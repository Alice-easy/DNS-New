import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  Clock,
  Gauge,
} from "lucide-react";
import { getMonitorTasks, getMonitorStats, getAvailableRecordsForMonitoring } from "@/server/monitoring";
import { getAccessibleDomains } from "@/server/record-changes";
import { MonitorTasksTable } from "./monitor-tasks-table";
import { MonitoringActions } from "./monitoring-actions";

export default async function MonitoringPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations("Monitoring");

  // Fetch data in parallel
  const [tasks, stats, domains] = await Promise.all([
    getMonitorTasks(),
    getMonitorStats(),
    getAccessibleDomains(),
  ]);

  // Get available records for all domains
  const availableRecordsPromises = domains.map(async (domain) => {
    const records = await getAvailableRecordsForMonitoring(domain.id);
    return records.map((record) => ({
      ...record,
      domainId: domain.id,
      domainName: domain.name,
    }));
  });
  const availableRecordsArrays = await Promise.all(availableRecordsPromises);
  const availableRecords = availableRecordsArrays.flat();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <MonitoringActions
          domains={domains}
          availableRecords={availableRecords}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalTasks")}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {t("enabledTasks", { count: stats.enabledTasks })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("successRate")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {t("last7Days")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("avgLatency")}
            </CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              {t("last7Days")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalChecks")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChecks}</div>
            <p className="text-xs text-muted-foreground">
              {t("last7Days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("monitorTasks")}</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("noTasks")}</h3>
              <p className="text-muted-foreground">{t("noTasksDesc")}</p>
            </div>
          ) : (
            <MonitorTasksTable tasks={tasks} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
