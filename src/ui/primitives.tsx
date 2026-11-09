import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const items = Children.toArray(children);
  const first = items.findIndex(isValidElement);
  // Associate the label (and hint) with the first control for assistive technology.
  const labelled = items.map((child, i) =>
    i === first && isValidElement(child)
      ? cloneElement(child as ReactElement<Record<string, unknown>>, {
          "aria-labelledby": `${id}-label`,
          ...(hint ? { "aria-describedby": `${id}-hint` } : {}),
        })
      : child,
  );
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label id={`${id}-label`} className="text-sm font-medium">
        {label}
      </Label>
      {labelled}
      {hint && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Section({
  title,
  desc,
  children,
  className,
}: {
  title?: ReactNode;
  desc?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-card grid gap-4 rounded-xl border p-5", className)}>
      {(title || desc) && (
        <header className="grid gap-1">
          {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
          {desc && <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "brand" | "ok" | "danger";
  className?: string;
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    brand: "bg-primary/15 text-primary",
    ok: "bg-emerald-500/15 text-emerald-500",
    danger: "bg-red-500/15 text-red-400",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  disabled,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("bg-muted/60 inline-flex flex-wrap gap-1 rounded-lg p-1", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "focus-visible:ring-ring/50 rounded-md px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50",
            o.value === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToggleRow({
  title,
  desc,
  control,
}: {
  title: ReactNode;
  desc?: ReactNode;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {desc && <span className="text-muted-foreground text-xs leading-relaxed">{desc}</span>}
      </div>
      {control}
    </div>
  );
}
