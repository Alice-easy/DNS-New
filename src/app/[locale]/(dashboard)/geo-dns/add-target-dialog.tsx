"use client";

import { useState, useTransition } from "react";
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
import { Loader2 } from "lucide-react";
import { addGeoRoutingTarget } from "@/server/geo-routing";
import { REGIONS, COUNTRIES } from "@/lib/geo-constants";
import { toast } from "sonner";

interface AddTargetDialogProps {
  ruleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTargetDialog({ ruleId, open, onOpenChange }: AddTargetDialogProps) {
  const t = useTranslations("GeoDns");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [target, setTarget] = useState("");
  const [ttl, setTtl] = useState(300);
  const [weight, setWeight] = useState(100);
  const [priority, setPriority] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruleId || !region || !target) {
      toast.error(t("fillRequired"));
      return;
    }

    startTransition(async () => {
      const result = await addGeoRoutingTarget({
        ruleId,
        region,
        country: country || undefined,
        target,
        ttl,
        weight,
        priority,
      });

      if (result.success) {
        toast.success(t("targetAdded"));
        onOpenChange(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error || t("addTargetFailed"));
      }
    });
  };

  const resetForm = () => {
    setRegion("");
    setCountry("");
    setTarget("");
    setTtl(300);
    setWeight(100);
    setPriority(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t("addTarget")}</DialogTitle>
          <DialogDescription>{t("addTargetDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Region */}
            <div className="grid gap-2">
              <Label>{t("region")} *</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectRegion")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country (Optional) */}
            <div className="grid gap-2">
              <Label>{t("country")}</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("allCountries")}</SelectItem>
                  {Object.entries(COUNTRIES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target */}
            <div className="grid gap-2">
              <Label htmlFor="target">{t("targetValue")} *</Label>
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={t("targetPlaceholder")}
              />
            </div>

            {/* TTL */}
            <div className="grid gap-2">
              <Label htmlFor="ttl">{t("ttl")}</Label>
              <Input
                id="ttl"
                type="number"
                value={ttl}
                onChange={(e) => setTtl(parseInt(e.target.value) || 300)}
                min={60}
              />
            </div>

            {/* Weight */}
            <div className="grid gap-2">
              <Label htmlFor="weight">{t("weight")}</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 100)}
                min={1}
                max={100}
              />
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="priority">{t("priority")}</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
