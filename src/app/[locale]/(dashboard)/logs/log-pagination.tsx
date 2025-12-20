"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function LogPagination({ pagination }: PaginationProps) {
  const t = useTranslations("Logs");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {t("pageInfo", {
          start: (pagination.page - 1) * pagination.limit + 1,
          end: Math.min(pagination.page * pagination.limit, pagination.total),
          total: pagination.total,
        })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          {t("previous")}
        </Button>
        <span className="text-sm">
          {t("pageOf", { page: pagination.page, total: pagination.totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          {t("next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
