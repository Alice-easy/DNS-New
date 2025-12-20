"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddRuleDialog } from "./add-rule-dialog";

export function GeoDnsActions() {
  const t = useTranslations("GeoDns");
  const [showAddRuleDialog, setShowAddRuleDialog] = useState(false);

  return (
    <>
      <Button onClick={() => setShowAddRuleDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {t("addRule")}
      </Button>

      <AddRuleDialog
        open={showAddRuleDialog}
        onOpenChange={setShowAddRuleDialog}
      />
    </>
  );
}
