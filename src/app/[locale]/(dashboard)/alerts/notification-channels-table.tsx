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
  MoreHorizontal,
  Trash2,
  TestTube,
  Loader2,
  Mail,
  Webhook,
  MessageCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  updateNotificationChannel,
  deleteNotificationChannel,
  testNotificationChannel,
} from "@/server/alerts";
import { toast } from "sonner";

interface ChannelConfig {
  email?: string;
  webhookUrl?: string;
  telegramChatId?: string;
  telegramBotToken?: string;
  discordWebhookUrl?: string;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  verified: boolean;
  lastTestAt: Date | null;
  config: ChannelConfig;
}

interface NotificationChannelsTableProps {
  channels: NotificationChannel[];
}

function getChannelIcon(type: string) {
  switch (type) {
    case "email":
      return <Mail className="h-4 w-4" />;
    case "webhook":
      return <Webhook className="h-4 w-4" />;
    case "telegram":
      return <MessageCircle className="h-4 w-4" />;
    case "discord":
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <Webhook className="h-4 w-4" />;
  }
}

export function NotificationChannelsTable({ channels }: NotificationChannelsTableProps) {
  const t = useTranslations("Alerts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);

  const handleToggleEnabled = (channelId: string, enabled: boolean) => {
    startTransition(async () => {
      await updateNotificationChannel(channelId, { enabled });
      router.refresh();
    });
  };

  const handleTest = (channelId: string) => {
    setTestingChannelId(channelId);
    startTransition(async () => {
      const result = await testNotificationChannel(channelId);
      setTestingChannelId(null);
      if (result.success) {
        toast.success(t("testSuccess"));
      } else {
        toast.error(result.error || t("testFailed"));
      }
      router.refresh();
    });
  };

  const handleDelete = (channelId: string) => {
    startTransition(async () => {
      await deleteNotificationChannel(channelId);
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("channelName")}</TableHead>
            <TableHead>{t("channelType")}</TableHead>
            <TableHead>{t("verified")}</TableHead>
            <TableHead>{t("lastTest")}</TableHead>
            <TableHead className="w-20">{t("enabled")}</TableHead>
            <TableHead className="w-24">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.map((channel) => (
            <TableRow key={channel.id}>
              <TableCell className="font-medium">{channel.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getChannelIcon(channel.type)}
                  <span className="capitalize">{channel.type}</span>
                </div>
              </TableCell>
              <TableCell>
                {channel.verified ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("verifiedYes")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    {t("verifiedNo")}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {channel.lastTestAt
                  ? new Date(channel.lastTestAt).toLocaleString()
                  : t("never")}
              </TableCell>
              <TableCell>
                <Switch
                  checked={channel.enabled}
                  onCheckedChange={(checked) => handleToggleEnabled(channel.id, checked)}
                  disabled={isPending}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTest(channel.id)}
                    disabled={testingChannelId === channel.id}
                  >
                    {testingChannelId === channel.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
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
                        onClick={() => handleDelete(channel.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
