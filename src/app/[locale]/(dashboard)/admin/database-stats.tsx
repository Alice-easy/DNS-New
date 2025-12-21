"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  HardDrive,
  Table2,
  RefreshCw,
  Loader2,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { getDatabaseStats } from "@/server/system-config";

interface TableStat {
  name: string;
  rowCount: number;
}

interface DatabaseStatsData {
  type: string;
  tables: TableStat[];
  totalRows: number;
  dbSize?: string;
}

// Table name display mapping
const TABLE_NAMES: Record<string, string> = {
  users: "Users",
  accounts: "OAuth Accounts",
  sessions: "Sessions",
  providers: "DNS Providers",
  domains: "Domains",
  records: "DNS Records",
  domain_shares: "Domain Shares",
  audit_logs: "Audit Logs",
  record_changes: "Record Changes",
  monitor_tasks: "Monitor Tasks",
  monitor_results: "Monitor Results",
  alert_rules: "Alert Rules",
  notification_channels: "Notification Channels",
  alert_history: "Alert History",
  system_config: "System Config",
};

export function DatabaseStats() {
  const t = useTranslations("SystemSettings");
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<DatabaseStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    startTransition(async () => {
      try {
        const data = await getDatabaseStats();
        setStats(data);
      } catch (error) {
        toast.error(t("loadStatsFailed"));
        console.error(error);
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDatabaseTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      sqlite: "SQLite",
      postgres: "PostgreSQL",
      mysql: "MySQL",
      turso: "Turso (LibSQL)",
    };
    return types[type] || type;
  };

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case "postgres":
        return "🐘";
      case "mysql":
        return "🐬";
      case "turso":
        return "🚀";
      default:
        return "📦";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              {t("databaseStats")}
            </CardTitle>
            <CardDescription className="text-sm">
              {t("databaseStatsDesc")}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Server className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("dbType")}</p>
              <p className="font-medium flex items-center gap-1">
                <span>{getDatabaseIcon(stats.type)}</span>
                {getDatabaseTypeLabel(stats.type)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Table2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("tablesWithData")}</p>
              <p className="font-medium">{stats.tables.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Database className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("totalRows")}</p>
              <p className="font-medium">{stats.totalRows.toLocaleString()}</p>
            </div>
          </div>

          {stats.dbSize && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <HardDrive className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("dbSize")}</p>
                <p className="font-medium">{stats.dbSize}</p>
              </div>
            </div>
          )}
        </div>

        {/* Table Stats */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t("tableDetails")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.tables
              .sort((a, b) => b.rowCount - a.rowCount)
              .map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-2 rounded border bg-card"
                >
                  <span className="text-sm truncate">
                    {TABLE_NAMES[table.name] || table.name}
                  </span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {table.rowCount.toLocaleString()}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
