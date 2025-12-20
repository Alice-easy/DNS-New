"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChangeValue {
  content: string;
  ttl: number;
  priority?: number | null;
  proxied?: boolean | null;
}

interface ChangeDetailsProps {
  change: {
    changeType: string;
    previousValue: ChangeValue | null;
    currentValue: ChangeValue | null;
    changedFields: string[] | null;
  };
}

export function ChangeDetails({ change }: ChangeDetailsProps) {
  const t = useTranslations("Changes");

  if (change.changeType === "added" && change.currentValue) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-green-600 truncate block cursor-help">
              {change.currentValue.content}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>
                <strong>{t("content")}:</strong> {change.currentValue.content}
              </p>
              <p>
                <strong>TTL:</strong> {change.currentValue.ttl}
              </p>
              {change.currentValue.priority !== null &&
                change.currentValue.priority !== undefined && (
                  <p>
                    <strong>{t("priority")}:</strong>{" "}
                    {change.currentValue.priority}
                  </p>
                )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (change.changeType === "deleted" && change.previousValue) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-red-600 line-through truncate block cursor-help">
              {change.previousValue.content}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>
                <strong>{t("content")}:</strong> {change.previousValue.content}
              </p>
              <p>
                <strong>TTL:</strong> {change.previousValue.ttl}
              </p>
              {change.previousValue.priority !== null &&
                change.previousValue.priority !== undefined && (
                  <p>
                    <strong>{t("priority")}:</strong>{" "}
                    {change.previousValue.priority}
                  </p>
                )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (change.changeType === "modified" && change.changedFields) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-blue-600 truncate block cursor-help">
              {change.changedFields.map((f) => t(`fields.${f}`)).join(", ")}{" "}
              {t("changed")}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">
            <div className="space-y-2">
              {change.changedFields.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="font-medium">{t(`fields.${field}`)}:</span>
                  <span className="text-red-400 line-through">
                    {change.previousValue?.[field as keyof ChangeValue]
                      ?.toString() ?? "-"}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-green-400">
                    {change.currentValue?.[field as keyof ChangeValue]
                      ?.toString() ?? "-"}
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className="text-sm text-muted-foreground">-</span>;
}
