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
import { Switch } from "@/components/ui/switch";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import {
  updateGeoRoutingTarget,
  deleteGeoRoutingTarget,
} from "@/server/geo-routing";
import { REGIONS, COUNTRIES } from "@/lib/geo-constants";
import { toast } from "sonner";

interface GeoTarget {
  id: string;
  ruleId: string;
  region: string;
  country: string | null;
  target: string;
  ttl: number;
  weight: number;
  priority: number;
  enabled: boolean;
  isHealthy: boolean;
}

interface GeoTargetsTableProps {
  targets: GeoTarget[];
}

export function GeoTargetsTable({ targets }: GeoTargetsTableProps) {
  const t = useTranslations("GeoDns");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggleEnabled = (targetId: string, enabled: boolean) => {
    startTransition(async () => {
      const result = await updateGeoRoutingTarget(targetId, { enabled });
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (targetId: string) => {
    startTransition(async () => {
      const result = await deleteGeoRoutingTarget(targetId);
      if (result.success) {
        toast.success(t("targetDeleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const getRegionName = (code: string) => {
    return REGIONS[code as keyof typeof REGIONS] || code;
  };

  const getCountryName = (code: string | null) => {
    if (!code) return null;
    return COUNTRIES[code as keyof typeof COUNTRIES] || code;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("region")}</TableHead>
            <TableHead>{t("country")}</TableHead>
            <TableHead>{t("targetValue")}</TableHead>
            <TableHead>{t("ttl")}</TableHead>
            <TableHead>{t("weight")}</TableHead>
            <TableHead>{t("priority")}</TableHead>
            <TableHead>{t("health")}</TableHead>
            <TableHead className="w-16">{t("enabled")}</TableHead>
            <TableHead className="w-12">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {targets.map((target) => (
            <TableRow key={target.id}>
              <TableCell>
                <Badge variant="outline">{getRegionName(target.region)}</Badge>
              </TableCell>
              <TableCell>
                {target.country ? (
                  <Badge variant="secondary">{getCountryName(target.country)}</Badge>
                ) : (
                  <span className="text-muted-foreground">{t("allCountries")}</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">{target.target}</TableCell>
              <TableCell>{target.ttl}s</TableCell>
              <TableCell>{target.weight}</TableCell>
              <TableCell>{target.priority}</TableCell>
              <TableCell>
                {target.isHealthy ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("healthy")}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {t("unhealthy")}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={target.enabled}
                  onCheckedChange={(checked) => handleToggleEnabled(target.id, checked)}
                  disabled={isPending}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(target.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
