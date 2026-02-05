import { Button } from "./ui/button";
import { ArrowLeft, Globe, Monitor, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsGeneral from "./settings/SettingsGeneral";
import SettingsSecurity from "./settings/SettingsSecurity";
import { t } from "@/lib/i18n";
import type { AppSettings } from "@/hooks/useSettings";

interface SettingsViewProps {
  onBack: () => void;
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
}

export default function SettingsView({
  onBack,
  settings,
  updateSetting,
}: SettingsViewProps) {
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-secondary/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t("settings_title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("settings_subtitle")}
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="general"
        orientation="vertical"
        className="flex-1 flex gap-8"
      >
        <TabsList className="flex flex-col h-auto w-64 bg-transparent space-y-1 p-0 justify-start items-stretch">
          <TabsTrigger
            value="general"
            className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-none border-l-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
          >
            <Monitor className="w-4 h-4" /> {t("tab_general")}
          </TabsTrigger>

          <TabsTrigger
            value="appearance"
            className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-none border-l-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
          >
            <Globe className="w-4 h-4" /> {t("tab_appearance")}
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-none border-l-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
          >
            <Shield className="w-4 h-4" /> {t("tab_security")}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 max-w-2xl">
          <TabsContent value="general" className="mt-0 space-y-6">
            <SettingsGeneral
              settings={settings}
              updateSetting={updateSetting}
            />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 space-y-6">
            <SettingsAppearance
              settings={settings}
              updateSetting={updateSetting}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-0 space-y-6">
            <SettingsSecurity
              settings={settings}
              updateSetting={updateSetting}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
