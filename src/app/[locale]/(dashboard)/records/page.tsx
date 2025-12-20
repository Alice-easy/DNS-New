import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, domains, records } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
import { Button } from "@/components/ui/button";
import { FileText, Globe, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";

async function getAllRecords(userId: string) {
  const allRecords = await db
    .select({
      id: records.id,
      type: records.type,
      name: records.name,
      content: records.content,
      ttl: records.ttl,
      proxied: records.proxied,
      domainId: domains.id,
      domainName: domains.name,
      providerName: providers.name,
    })
    .from(records)
    .innerJoin(domains, eq(records.domainId, domains.id))
    .innerJoin(providers, eq(domains.providerId, providers.id))
    .where(eq(providers.userId, userId))
    .orderBy(domains.name, records.type, records.name)
    .limit(100);

  return allRecords;
}

function getTypeBadgeColor(type: string) {
  switch (type) {
    case "A":
    case "AAAA":
      return "bg-blue-100 text-blue-800";
    case "CNAME":
      return "bg-green-100 text-green-800";
    case "MX":
      return "bg-purple-100 text-purple-800";
    case "TXT":
      return "bg-yellow-100 text-yellow-800";
    case "NS":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function RecordsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const t = await getTranslations("Records");
  const tCommon = await getTranslations("Common");
  const tNav = await getTranslations("Navigation");
  const allRecords = await getAllRecords(userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Content */}
      {allRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("noRecords")}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t("noRecordsDesc")}
            </p>
            <Button asChild>
              <Link href="/domains">
                <Globe className="mr-2 h-4 w-4" />
                {tNav("domains")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>
              {allRecords.length} {tNav("records")} (max 100)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{tCommon("type")}</TableHead>
                  <TableHead>{tCommon("name")}</TableHead>
                  <TableHead>{tCommon("value")}</TableHead>
                  <TableHead>{tNav("domains")}</TableHead>
                  <TableHead className="w-20 text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getTypeBadgeColor(record.type)}
                      >
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.name === record.domainName
                        ? "@"
                        : record.name.replace(`.${record.domainName}`, "")}
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {record.content}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/domains/${record.domainId}`}
                        className="text-primary hover:underline"
                      >
                        {record.domainName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/domains/${record.domainId}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
