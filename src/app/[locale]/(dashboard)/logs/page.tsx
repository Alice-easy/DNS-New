import { getAuditLogs, getAuditStats } from "@/server/audit-logs";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Upload,
  Download,
  Globe,
  Server,
  FileText,
  User,
  Share2,
} from "lucide-react";
import { FormattedDate } from "@/components/formatted-date";
import { LogFilters } from "./log-filters";
import { LogPagination } from "./log-pagination";

interface LogsPageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    resourceType?: string;
    days?: string;
    search?: string;
  }>;
}

function getActionIcon(action: string) {
  switch (action) {
    case "create":
      return <Plus className="h-4 w-4" />;
    case "update":
      return <Pencil className="h-4 w-4" />;
    case "delete":
      return <Trash2 className="h-4 w-4" />;
    case "sync":
      return <RefreshCw className="h-4 w-4" />;
    case "import":
      return <Upload className="h-4 w-4" />;
    case "export":
      return <Download className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "create":
      return "bg-green-100 text-green-800";
    case "update":
      return "bg-blue-100 text-blue-800";
    case "delete":
      return "bg-red-100 text-red-800";
    case "sync":
      return "bg-purple-100 text-purple-800";
    case "import":
      return "bg-orange-100 text-orange-800";
    case "export":
      return "bg-teal-100 text-teal-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getResourceIcon(resourceType: string) {
  switch (resourceType) {
    case "domain":
      return <Globe className="h-4 w-4" />;
    case "provider":
      return <Server className="h-4 w-4" />;
    case "record":
      return <FileText className="h-4 w-4" />;
    case "user":
      return <User className="h-4 w-4" />;
    case "share":
      return <Share2 className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const t = await getTranslations("Logs");
  const tCommon = await getTranslations("Common");

  const page = params.page ? parseInt(params.page) : 1;
  const action = params.action as "create" | "update" | "delete" | "sync" | "import" | "export" | undefined;
  const resourceType = params.resourceType as "provider" | "domain" | "record" | "user" | "share" | undefined;
  const days = params.days ? parseInt(params.days) : undefined;
  const search = params.search;

  const [{ logs, pagination }, stats] = await Promise.all([
    getAuditLogs({ page, action, resourceType, days, search }),
    getAuditStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("totalActions")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("creates")}</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.creates}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("updates")}</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.updates}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("deletes")}</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.deletes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("syncs")}</CardDescription>
            <CardTitle className="text-2xl text-purple-600">{stats.syncs}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <LogFilters />

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentLogs")}</CardTitle>
          <CardDescription>
            {t("showing", { count: logs.length, total: pagination.total })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("noLogs")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">{t("time")}</TableHead>
                    <TableHead>{t("user")}</TableHead>
                    <TableHead className="w-28">{t("action")}</TableHead>
                    <TableHead>{t("resource")}</TableHead>
                    <TableHead>{t("details")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.createdAt && <FormattedDate date={log.createdAt} />}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.userName || log.userEmail || t("unknownUser")}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getActionColor(log.action)} flex items-center gap-1 w-fit`}>
                          {getActionIcon(log.action)}
                          {t(`actions.${log.action}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resourceType)}
                          <span className="text-sm">
                            {t(`resources.${log.resourceType}`)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.details ? (
                          <span className="text-sm text-muted-foreground truncate block">
                            {log.details.name || log.details.domain || log.details.type || JSON.stringify(log.details).slice(0, 50)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
                <LogPagination pagination={pagination} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
