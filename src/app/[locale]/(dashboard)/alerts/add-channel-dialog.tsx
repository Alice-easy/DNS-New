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
import { createNotificationChannel, type ChannelType } from "@/server/alerts";

interface AddChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddChannelDialog({ open, onOpenChange }: AddChannelDialogProps) {
  const t = useTranslations("Alerts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("webhook");
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const handleSubmit = () => {
    if (!name) return;

    const config: Record<string, string> = {};

    switch (type) {
      case "email":
        if (!email) return;
        config.email = email;
        break;
      case "webhook":
        if (!webhookUrl) return;
        config.webhookUrl = webhookUrl;
        break;
      case "discord":
        if (!discordWebhookUrl) return;
        config.discordWebhookUrl = discordWebhookUrl;
        break;
      case "telegram":
        if (!telegramBotToken || !telegramChatId) return;
        config.telegramBotToken = telegramBotToken;
        config.telegramChatId = telegramChatId;
        break;
    }

    startTransition(async () => {
      const result = await createNotificationChannel({
        name,
        type,
        config,
      });

      if (result.success) {
        onOpenChange(false);
        setName("");
        setType("webhook");
        setEmail("");
        setWebhookUrl("");
        setDiscordWebhookUrl("");
        setTelegramBotToken("");
        setTelegramChatId("");
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addChannel")}</DialogTitle>
          <DialogDescription>{t("addChannelDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel Name */}
          <div className="space-y-2">
            <Label>{t("channelName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("channelNamePlaceholder")}
            />
          </div>

          {/* Channel Type */}
          <div className="space-y-2">
            <Label>{t("channelType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as ChannelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="email" disabled>
                  Email ({t("comingSoon")})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Webhook URL */}
          {type === "webhook" && (
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
              <p className="text-xs text-muted-foreground">
                {t("webhookDesc")}
              </p>
            </div>
          )}

          {/* Discord Webhook URL */}
          {type === "discord" && (
            <div className="space-y-2">
              <Label>Discord Webhook URL</Label>
              <Input
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-xs text-muted-foreground">
                {t("discordDesc")}
              </p>
            </div>
          )}

          {/* Telegram Config */}
          {type === "telegram" && (
            <>
              <div className="space-y-2">
                <Label>Bot Token</Label>
                <Input
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                />
              </div>
              <div className="space-y-2">
                <Label>Chat ID</Label>
                <Input
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-1001234567890"
                />
                <p className="text-xs text-muted-foreground">
                  {t("telegramDesc")}
                </p>
              </div>
            </>
          )}

          {/* Email */}
          {type === "email" && (
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!name || isPending}>
            {isPending ? t("creating") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
