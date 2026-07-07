"use client";

import TelegramConnect from "@/components/TelegramConnect";
import { useLanguage } from "@/lib/LanguageContext";

export default function ChannelsSettings({ workspaceId }: { workspaceId: string | null }) {
  const { t } = useLanguage();

  return (
    <div>
      <TelegramConnect workspaceId={workspaceId} />

      <div className="border border-line rounded-lg p-3 mb-3 opacity-60">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Instagram Direct</div>
          <span className="text-[11px] bg-paper rounded px-2 py-0.5">{t("channels.comingSoon")}</span>
        </div>
        <p className="text-xs text-ink/50 mt-1">{t("channels.instagramNote")}</p>
      </div>

      <div className="border border-line rounded-lg p-3 opacity-60">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">WhatsApp Business</div>
          <span className="text-[11px] bg-paper rounded px-2 py-0.5">{t("channels.comingSoon")}</span>
        </div>
        <p className="text-xs text-ink/50 mt-1">{t("channels.whatsappNote")}</p>
      </div>
    </div>
  );
}
