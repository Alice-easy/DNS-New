import {
  getRecordChanges,
  getChangeStats,
  getAccessibleDomains,
} from "@/server/record-changes";
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
import { GitCompare, Plus, Pencil, Trash2 } from "lucide-react";
import { ChangeFilters } from "./change-filters";
import { ChangePagination } from "./change-pagination";
import { ChangeDetails } from "./change-details";

interface ChangesPageProps {
  searchParams: Promise<{
    page?: string;
    domainId?: string;
    changeType?: string;
    days?: string;
    search?: string;
  }>;
}

function getChangeIcon(changeType: string) {
  switch (changeType) {
    case "added":
      return <Plus className="h-4 w-4" />;
    case "modified":
      return <Pencil className="h-4 w-4" />;
    case "deleted":
      return <Trash2 className="h-4 w-4" />;
    default:
      return <GitCompare className="h-4 w-4" />;
  }
}

function getChangeColor(changeType: string) {
  switch (changeType) {
    case "added":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "modified":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "deleted":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export default async function ChangesPage({ searchParams }: ChangesPageProps) {
  const params = await searchParams;
  const t = await getTranslations("Changes");

  const page = params.page ? parseInt(params.page) : 1;
  const domainId = params.domainId;
  const changeType = params.changeType as
    | "added"
    | "modified"
    | "deleted"
    | undefined;
  const days = params.days ? parseInt(params.days) : undefined;
  const search = params.search;

  const [{ changes, pagination }, stats, domains] = await Promise.all([
    getRecordChanges({ page, domainId, changeType, days, search }),
    getChangeStats(),
    getAccessibleDomains(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitCompare className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("totalChanges")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("added")}</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {stats.added}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("modified")}</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {stats.modified}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("deleted")}</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {stats.deleted}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <ChangeFilters domains={domains} />

      {/* Changes Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentChanges")}</CardTitle>
          <CardDescription>
            {t("showing", { count: changes.length, total: pagination.total })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <div className="text-center py-8">
              <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("noChanges")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">{t("time")}</TableHead>
                      <TableHead>{t("domain")}</TableHead>
                      <TableHead className="w-28">{t("changeType")}</TableHead>
                      <TableHead>{t("record")}</TableHead>
                      <TableHead>{t("changes")}</TableHead>
                      <TableHead>{t("user")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map((change) => (
                      <TableRow key={change.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {change.createdAt &&
                            new Date(change.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {change.domainName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${getChangeColor(
                              change.changeType
                            )} flex items-center gap-1 w-fit`}
                          >
                            {getChangeIcon(change.changeType)}
                            {t(`types.${change.changeType}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {change.recordType}
                            </Badge>
                            <span className="text-sm">
                              {change.recordName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <ChangeDetails change={change} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {change.userName || t("unknownUser")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4">
                <ChangePagination pagination={pagination} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
