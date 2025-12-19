import { notFound } from "next/navigation";
import { getDomainWithRecords, syncDomainRecords } from "@/server/domains";
import { Button } from "@/components/ui/button";
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
import {
  Globe,
  RefreshCw,
  Plus,
  ArrowLeft,
  Shield,
  ShieldOff,
} from "lucide-react";
import Link from "next/link";
import { RecordActions } from "./record-actions";
import { AddRecordDialog } from "./add-record-dialog";

interface DomainDetailPageProps {
  params: Promise<{ id: string }>;
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

export default async function DomainDetailPage({
  params,
}: DomainDetailPageProps) {
  const { id } = await params;
  const domain = await getDomainWithRecords(id);

  if (!domain) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/domains">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            <h1 className="text-3xl font-bold">{domain.name}</h1>
          </div>
          <p className="text-muted-foreground">
            {domain.providerLabel} ({domain.providerName})
          </p>
        </div>
        <div className="flex gap-2">
          <form
            action={async () => {
              "use server";
              await syncDomainRecords(id);
            }}
          >
            <Button type="submit" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Records
            </Button>
          </form>
          <AddRecordDialog domainId={id} domainName={domain.name} />
        </div>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Records</CardTitle>
          <CardDescription>
            {domain.records.length} records •{" "}
            {domain.syncedAt
              ? `Last synced ${new Date(domain.syncedAt).toLocaleString()}`
              : "Never synced"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domain.records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No records found. Click "Sync Records" to fetch records from the
                provider, or add a new record.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-20">TTL</TableHead>
                  <TableHead className="w-20">Proxy</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domain.records.map((record) => (
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
                      {record.name === domain.name ? "@" : record.name.replace(`.${domain.name}`, "")}
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {record.content}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.ttl === 1 ? "Auto" : `${record.ttl}s`}
                    </TableCell>
                    <TableCell>
                      {record.proxied ? (
                        <Shield className="h-4 w-4 text-orange-500" />
                      ) : (
                        <ShieldOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RecordActions
                        domainId={id}
                        record={record}
                        domainName={domain.name}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
