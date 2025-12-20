"use server";

import { getTranslations } from "next-intl/server";
import { getGeoRoutingRules, getGeoRoutingStats } from "@/server/geo-routing";
import { GeoDnsActions } from "./geo-dns-actions";
import { GeoRulesTable } from "./geo-rules-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Globe,
  Target,
  Activity,
  CheckCircle,
} from "lucide-react";

export default async function GeoDnsPage() {
  const t = await getTranslations("GeoDns");
  const [rules, stats] = await Promise.all([
    getGeoRoutingRules(),
    getGeoRoutingStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <GeoDnsActions />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalRules")}
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("enabledRules")}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enabledRules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalTargets")}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTargets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("healthyTargets")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.healthyTargets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Geo Routing Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("rulesTitle")}</CardTitle>
          <CardDescription>{t("rulesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noRules")}
            </div>
          ) : (
            <GeoRulesTable rules={rules} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
