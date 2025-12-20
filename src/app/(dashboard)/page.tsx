import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, domains, records } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Globe, FileText, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getStats(userId: string) {
  const [providerCount] = await db
    .select({ count: count() })
    .from(providers)
    .where(eq(providers.userId, userId));

  const [domainCount] = await db
    .select({ count: count() })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(providers.userId, userId));

  const [recordCount] = await db
    .select({ count: count() })
    .from(records)
    .innerJoin(domains, eq(records.domainId, domains.id))
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(providers.userId, userId));

  return {
    providers: providerCount.count,
    domains: domainCount.count,
    records: recordCount.count,
  };
}

async function getRecentDomains(userId: string) {
  const recentDomains = await db
    .select({
      id: domains.id,
      name: domains.name,
      status: domains.status,
      providerName: providers.name,
    })
    .from(domains)
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(providers.userId, userId))
    .orderBy(domains.createdAt)
    .limit(5);

  return recentDomains;
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const t = await getTranslations("Dashboard");
  const tNav = await getTranslations("Navigation");
  const tCommon = await getTranslations("Common");
  const stats = await getStats(userId);
  const recentDomains = await getRecentDomains(userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome")}, {session?.user?.name || "User"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tNav("providers")}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.providers}</div>
            <p className="text-xs text-muted-foreground">
              {t("totalProviders")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tNav("domains")}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.domains}</div>
            <p className="text-xs text-muted-foreground">{t("totalDomains")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tNav("records")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.records}</div>
            <p className="text-xs text-muted-foreground">{t("totalRecords")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Domains */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.providers === 0 ? (
              <Button asChild className="w-full justify-start">
                <Link href="/providers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addProvider")}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/providers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addProvider")}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/domains">
                    <Globe className="mr-2 h-4 w-4" />
                    {tNav("domains")}
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Domains */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("recentActivity")}</CardTitle>
              <CardDescription>{t("subtitle")}</CardDescription>
            </div>
            {recentDomains.length > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/domains">
                  {tCommon("view")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noProvidersDesc")}
              </p>
            ) : (
              <div className="space-y-2">
                {recentDomains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <p className="font-medium">{domain.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {domain.providerName}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        domain.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {domain.status === "active" ? tCommon("active") : tCommon("pending")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
