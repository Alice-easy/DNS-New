"use client";

import { useState, useTransition } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MoreHorizontal,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Globe,
  MapPin,
} from "lucide-react";
import {
  updateGeoRoutingRule,
  deleteGeoRoutingRule,
} from "@/server/geo-routing";
import { toast } from "sonner";
import { AddTargetDialog } from "./add-target-dialog";
import { GeoTargetsTable } from "./geo-targets-table";

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

interface GeoRule {
  id: string;
  domainId: string;
  domainName: string;
  name: string;
  recordName: string;
  recordType: string;
  enabled: boolean;
  defaultTarget: string;
  defaultTtl: number;
  loadBalancing: string;
  healthCheck: boolean;
  healthCheckInterval: number | null;
  createdAt: Date | null;
  targets: GeoTarget[];
}

interface GeoRulesTableProps {
  rules: GeoRule[];
}

export function GeoRulesTable({ rules }: GeoRulesTableProps) {
  const t = useTranslations("GeoDns");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [addTargetRuleId, setAddTargetRuleId] = useState<string | null>(null);

  const toggleExpanded = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const handleToggleEnabled = (ruleId: string, enabled: boolean) => {
    startTransition(async () => {
      const result = await updateGeoRoutingRule(ruleId, { enabled });
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (ruleId: string) => {
    startTransition(async () => {
      const result = await deleteGeoRoutingRule(ruleId);
      if (result.success) {
        toast.success(t("ruleDeleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const getLoadBalancingLabel = (lb: string) => {
    switch (lb) {
      case "round_robin":
        return t("roundRobin");
      case "weighted":
        return t("weighted");
      case "failover":
        return t("failover");
      default:
        return lb;
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>{t("ruleName")}</TableHead>
              <TableHead>{t("domain")}</TableHead>
              <TableHead>{t("record")}</TableHead>
              <TableHead>{t("loadBalancing")}</TableHead>
              <TableHead>{t("targets")}</TableHead>
              <TableHead className="w-20">{t("enabled")}</TableHead>
              <TableHead className="w-24">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <Collapsible key={rule.id} asChild>
                <>
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleExpanded(rule.id)}
                        >
                          {expandedRules.has(rule.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {rule.domainName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.recordName}.{rule.domainName}
                      </Badge>
                      <Badge variant="secondary" className="ml-1">
                        {rule.recordType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getLoadBalancingLabel(rule.loadBalancing)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rule.targets.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleEnabled(rule.id, checked)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAddTargetRuleId(rule.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(rule.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="p-0">
                        {expandedRules.has(rule.id) && (
                          <div className="p-4 space-y-4">
                            {/* Default Target Info */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                <strong>{t("defaultTarget")}:</strong> {rule.defaultTarget}
                              </span>
                              <span>
                                <strong>{t("defaultTtl")}:</strong> {rule.defaultTtl}s
                              </span>
                              {rule.healthCheck && (
                                <Badge variant="outline">
                                  {t("healthCheckEnabled")} ({rule.healthCheckInterval}s)
                                </Badge>
                              )}
                            </div>

                            {/* Targets Table */}
                            {rule.targets.length > 0 ? (
                              <GeoTargetsTable targets={rule.targets} />
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>{t("noTargets")}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => setAddTargetRuleId(rule.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  {t("addTarget")}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddTargetDialog
        ruleId={addTargetRuleId}
        open={!!addTargetRuleId}
        onOpenChange={(open) => !open && setAddTargetRuleId(null)}
      />
    </>
  );
}
