import { Button } from "@/components/ui/button";

import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <div>
      <Button onClick={() => setTheme("light")}>Light</Button>
      <Button onClick={() => setTheme("dark")}>Dark</Button>
      <Button onClick={() => setTheme("system")}>System</Button>
    </div>
  );
}
