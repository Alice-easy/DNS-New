"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function LogFilters() {
  const t = useTranslations("Logs");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentAction = searchParams.get("action") || "";
  const currentResourceType = searchParams.get("resourceType") || "";
  const currentDays = searchParams.get("days") || "";
  const currentSearch = searchParams.get("search") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to first page when filtering
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = currentAction || currentResourceType || currentDays || currentSearch;

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Action Filter */}
      <Select value={currentAction} onValueChange={(v) => updateFilters("action", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("filterAction")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="create">{t("actions.create")}</SelectItem>
          <SelectItem value="update">{t("actions.update")}</SelectItem>
          <SelectItem value="delete">{t("actions.delete")}</SelectItem>
          <SelectItem value="sync">{t("actions.sync")}</SelectItem>
          <SelectItem value="import">{t("actions.import")}</SelectItem>
          <SelectItem value="export">{t("actions.export")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Resource Type Filter */}
      <Select value={currentResourceType} onValueChange={(v) => updateFilters("resourceType", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("filterResource")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="provider">{t("resources.provider")}</SelectItem>
          <SelectItem value="domain">{t("resources.domain")}</SelectItem>
          <SelectItem value="record">{t("resources.record")}</SelectItem>
          <SelectItem value="user">{t("resources.user")}</SelectItem>
          <SelectItem value="share">{t("resources.share")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Days Filter */}
      <Select value={currentDays} onValueChange={(v) => updateFilters("days", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("filterDays")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">{t("last1Day")}</SelectItem>
          <SelectItem value="7">{t("last7Days")}</SelectItem>
          <SelectItem value="30">{t("last30Days")}</SelectItem>
          <SelectItem value="90">{t("last90Days")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="flex-1 min-w-[200px] max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          defaultValue={currentSearch}
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters("search", (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}
