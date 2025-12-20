"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddRuleDialog } from "./add-rule-dialog";
import { AddChannelDialog } from "./add-channel-dialog";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface AlertsActionsProps {
  channels: Channel[];
}

export function AlertsActions({ channels }: AlertsActionsProps) {
  const t = useTranslations("Alerts");
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowChannelDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addChannel")}
        </Button>
        <Button onClick={() => setShowRuleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addRule")}
        </Button>
      </div>

      <AddRuleDialog
        open={showRuleDialog}
        onOpenChange={setShowRuleDialog}
        channels={channels}
      />

      <AddChannelDialog
        open={showChannelDialog}
        onOpenChange={setShowChannelDialog}
      />
    </>
  );
}
