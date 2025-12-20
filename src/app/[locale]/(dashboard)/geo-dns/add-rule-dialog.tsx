"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  createGeoRoutingRule,
  getAccessibleDomainsForGeoRouting,
} from "@/server/geo-routing";
import type { RecordType, LoadBalancing } from "@/lib/geo-constants";
import { toast } from "sonner";

interface AddRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRuleDialog({ open, onOpenChange }: AddRuleDialogProps) {
  const t = useTranslations("GeoDns");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);

  // Form state
  const [domainId, setDomainId] = useState("");
  const [name, setName] = useState("");
  const [recordName, setRecordName] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [defaultTarget, setDefaultTarget] = useState("");
  const [defaultTtl, setDefaultTtl] = useState(300);
  const [loadBalancing, setLoadBalancing] = useState<LoadBalancing>("round_robin");
  const [healthCheck, setHealthCheck] = useState(false);
  const [healthCheckInterval, setHealthCheckInterval] = useState(60);

  useEffect(() => {
    if (open) {
      setLoadingDomains(true);
      getAccessibleDomainsForGeoRouting()
        .then(setDomains)
        .finally(() => setLoadingDomains(false));
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!domainId || !name || !recordName || !defaultTarget) {
      toast.error(t("fillRequired"));
      return;
    }

    startTransition(async () => {
      const result = await createGeoRoutingRule({
        domainId,
        name,
        recordName,
        recordType,
        defaultTarget,
        defaultTtl,
        loadBalancing,
        healthCheck,
        healthCheckInterval,
      });

      if (result.success) {
        toast.success(t("ruleCreated"));
        onOpenChange(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error || t("createFailed"));
      }
    });
  };

  const resetForm = () => {
    setDomainId("");
    setName("");
    setRecordName("");
    setRecordType("A");
    setDefaultTarget("");
    setDefaultTtl(300);
    setLoadBalancing("round_robin");
    setHealthCheck(false);
    setHealthCheckInterval(60);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addRule")}</DialogTitle>
          <DialogDescription>{t("addRuleDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Domain */}
            <div className="grid gap-2">
              <Label htmlFor="domain">{t("domain")} *</Label>
              <Select value={domainId} onValueChange={setDomainId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectDomain")} />
                </SelectTrigger>
                <SelectContent>
                  {loadingDomains ? (
                    <div className="p-2 text-center text-muted-foreground">
                      {t("loading")}
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      {t("noDomains")}
                    </div>
                  ) : (
                    domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Rule Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{t("ruleName")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("ruleNamePlaceholder")}
              />
            </div>

            {/* Record Name */}
            <div className="grid gap-2">
              <Label htmlFor="recordName">{t("recordName")} *</Label>
              <Input
                id="recordName"
                value={recordName}
                onChange={(e) => setRecordName(e.target.value)}
                placeholder={t("recordNamePlaceholder")}
              />
            </div>

            {/* Record Type */}
            <div className="grid gap-2">
              <Label>{t("recordType")}</Label>
              <Select value={recordType} onValueChange={(v) => setRecordType(v as RecordType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="AAAA">AAAA</SelectItem>
                  <SelectItem value="CNAME">CNAME</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Target */}
            <div className="grid gap-2">
              <Label htmlFor="defaultTarget">{t("defaultTarget")} *</Label>
              <Input
                id="defaultTarget"
                value={defaultTarget}
                onChange={(e) => setDefaultTarget(e.target.value)}
                placeholder={t("defaultTargetPlaceholder")}
              />
            </div>

            {/* Default TTL */}
            <div className="grid gap-2">
              <Label htmlFor="defaultTtl">{t("defaultTtl")}</Label>
              <Input
                id="defaultTtl"
                type="number"
                value={defaultTtl}
                onChange={(e) => setDefaultTtl(parseInt(e.target.value) || 300)}
                min={60}
              />
            </div>

            {/* Load Balancing */}
            <div className="grid gap-2">
              <Label>{t("loadBalancing")}</Label>
              <Select value={loadBalancing} onValueChange={(v) => setLoadBalancing(v as LoadBalancing)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">{t("roundRobin")}</SelectItem>
                  <SelectItem value="weighted">{t("weighted")}</SelectItem>
                  <SelectItem value="failover">{t("failover")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Health Check */}
            <div className="flex items-center justify-between">
              <Label htmlFor="healthCheck">{t("enableHealthCheck")}</Label>
              <Switch
                id="healthCheck"
                checked={healthCheck}
                onCheckedChange={setHealthCheck}
              />
            </div>

            {/* Health Check Interval */}
            {healthCheck && (
              <div className="grid gap-2">
                <Label htmlFor="healthCheckInterval">{t("healthCheckInterval")}</Label>
                <Input
                  id="healthCheckInterval"
                  type="number"
                  value={healthCheckInterval}
                  onChange={(e) => setHealthCheckInterval(parseInt(e.target.value) || 60)}
                  min={30}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
