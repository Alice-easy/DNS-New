import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, domains, records } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, ArrowRight, Zap, Settings, Radar, Activity } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("welcome")}, {session?.user?.name || "User"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={tNav("providers")}
          value={stats.providers}
          icon="server"
          color="blue"
          trend={{ value: 12, label: "较上月" }}
        />

        <StatCard
          title={tNav("domains")}
          value={stats.domains}
          icon="globe"
          color="green"
          trend={{ value: 8, label: "较上月" }}
        />

        <StatCard
          title={tNav("records")}
          value={stats.records}
          icon="fileText"
          color="purple"
          trend={{ value: -3, label: "较上月" }}
        />

        <StatCard
          title="系统状态"
          value="正常"
          icon="activity"
          color="orange"
        />
      </div>

      {/* Quick Actions & Recent Domains */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="relative overflow-hidden">
          {/* 装饰性背景 */}
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />

          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t("quickActions")}
                </CardTitle>
                <CardDescription>{t("subtitle")}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-2 sm:grid-cols-2 relative">
            {stats.providers === 0 ? (
              <Button asChild className="w-full col-span-2">
                <Link href="/providers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addProvider")}
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col items-start gap-2 p-4 hover:bg-primary/5 hover:border-primary/30"
                >
                  <Link href="/providers/new">
                    <div className="flex w-full items-center justify-between">
                      <Plus className="h-5 w-5 text-primary" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{t("addProvider")}</div>
                      <div className="text-xs text-muted-foreground">连接新的 DNS 服务</div>
                    </div>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col items-start gap-2 p-4 hover:bg-primary/5 hover:border-primary/30"
                >
                  <Link href="/domains">
                    <div className="flex w-full items-center justify-between">
                      <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{tNav("domains")}</div>
                      <div className="text-xs text-muted-foreground">查看和编辑域名</div>
                    </div>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col items-start gap-2 p-4 hover:bg-primary/5 hover:border-primary/30"
                >
                  <Link href="/monitoring">
                    <div className="flex w-full items-center justify-between">
                      <Radar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{tNav("monitoring")}</div>
                      <div className="text-xs text-muted-foreground">实时状态监控</div>
                    </div>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col items-start gap-2 p-4 hover:bg-primary/5 hover:border-primary/30"
                >
                  <Link href="/settings">
                    <div className="flex w-full items-center justify-between">
                      <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{tNav("settings")}</div>
                      <div className="text-xs text-muted-foreground">配置和偏好</div>
                    </div>
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
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {t("recentActivity")}
              </CardTitle>
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">暂无活动记录</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  您的操作活动将在这里显示
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDomains.map((domain, index) => (
                  <div
                    key={domain.id}
                    className={cn(
                      "group flex items-center justify-between rounded-lg border p-3",
                      "transition-all duration-200",
                      "hover:bg-accent/50 hover:border-accent-foreground/20 hover:shadow-sm",
                      "cursor-pointer"
                    )}
                  >
                    {/* 时间线指示器 */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                        {/* 连接线 - 除了最后一个 */}
                        {index !== recentDomains.length - 1 && (
                          <div className="absolute top-9 left-1/2 h-full w-px -translate-x-1/2 bg-border" />
                        )}
                        <div className="rounded-full bg-primary/10 p-2">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {domain.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{domain.providerName}</span>
                          <span>•</span>
                          <span>2分钟前</span>
                        </div>
                      </div>
                    </div>

                    {/* 状态徽章 */}
                    <div className="flex items-center gap-2">
                      {domain.status === "active" ? (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          <div className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                          {tCommon("active")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <div className="mr-1 h-1.5 w-1.5 rounded-full bg-yellow-500" />
                          {tCommon("pending")}
                        </Badge>
                      )}
                    </div>
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
