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

interface Domain {
  id: string;
  name: string;
}

interface ChangeFiltersProps {
  domains: Domain[];
}

export function ChangeFilters({ domains }: ChangeFiltersProps) {
  const t = useTranslations("Changes");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDomain = searchParams.get("domainId") || "";
  const currentChangeType = searchParams.get("changeType") || "";
  const currentDays = searchParams.get("days") || "";
  const currentSearch = searchParams.get("search") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters =
    currentDomain || currentChangeType || currentDays || currentSearch;

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Domain Filter */}
      <Select
        value={currentDomain}
        onValueChange={(v) => updateFilters("domainId", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("filterDomain")} />
        </SelectTrigger>
        <SelectContent>
          {domains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              {domain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Change Type Filter */}
      <Select
        value={currentChangeType}
        onValueChange={(v) => updateFilters("changeType", v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("filterChangeType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="added">{t("types.added")}</SelectItem>
          <SelectItem value="modified">{t("types.modified")}</SelectItem>
          <SelectItem value="deleted">{t("types.deleted")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Days Filter */}
      <Select
        value={currentDays}
        onValueChange={(v) => updateFilters("days", v)}
      >
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
