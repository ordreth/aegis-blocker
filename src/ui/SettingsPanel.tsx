import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatDuration, LANGUAGE_NAMES } from "@/i18n";
import { LOCALES } from "@/shared/schema";
import type { Settings } from "@/shared/types";
import { LOCK_PRESETS } from "./LockDialog";
import { Field, Section, Segmented, ToggleRow } from "./primitives";
import { useAegis } from "./store";

export function SettingsPanel() {
  const { t, state, run, locked } = useAegis();
  if (!state) return null;
  const s = state.settings;
  const set = (patch: Partial<Settings>) => void run({ t: "settings.set", patch });

  return (
    <div className="grid gap-5">
      <Section title={t("appearance")}>
        <Field label={t("theme")}>
          <Segmented
            value={s.theme}
            onChange={(theme) => set({ theme })}
            options={[
              { value: "system", label: t("theme_system") },
              { value: "dark", label: t("theme_dark") },
              { value: "light", label: t("theme_light") },
            ]}
          />
        </Field>
        <Field label={t("language")}>
          <Select value={s.language} onValueChange={(language) => set({ language: language as Settings["language"] })}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("language_system")}</SelectItem>
              {LOCALES.map((l) => (
                <SelectItem key={l} value={l}>
                  {LANGUAGE_NAMES[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <ToggleRow
          title={t("confirm_delete")}
          desc={t("confirm_delete_desc")}
          control={<Switch checked={s.confirmDelete} onCheckedChange={(confirmDelete) => set({ confirmDelete })} />}
        />
      </Section>

      <Section title={t("lock_title")}>
        <Field label={t("lock_hours")}>
          <Select
            value={String(s.lockHours)}
            disabled={locked}
            onValueChange={(v) => set({ lockHours: Number(v) })}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([...LOCK_PRESETS, s.lockHours])]
                .sort((a, b) => a - b)
                .map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {formatDuration(h * 3_600_000, t)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title={t("snooze_title")} desc={t("snooze_desc")}>
        <ToggleRow
          title={t("snooze_enable")}
          control={
            <Switch
              checked={s.snooze.enabled}
              disabled={locked}
              onCheckedChange={(enabled) => set({ snooze: { ...s.snooze, enabled } })}
            />
          }
        />
        {s.snooze.enabled && (
          <div className="grid max-w-sm gap-5">
            <Field label={`${t("snooze_wait")}: ${s.snooze.waitSeconds}`}>
              <Slider
                min={5}
                max={120}
                step={5}
                disabled={locked}
                value={[s.snooze.waitSeconds]}
                onValueCommit={([v]) => set({ snooze: { ...s.snooze, waitSeconds: v ?? 30 } })}
              />
            </Field>
            <Field label={`${t("snooze_minutes")}: ${s.snooze.minutes}`}>
              <Slider
                min={1}
                max={30}
                disabled={locked}
                value={[s.snooze.minutes]}
                onValueCommit={([v]) => set({ snooze: { ...s.snooze, minutes: v ?? 5 } })}
              />
            </Field>
          </div>
        )}
      </Section>
    </div>
  );
}
