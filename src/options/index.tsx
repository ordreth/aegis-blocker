import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { ThemeProvider } from "@/components/theme-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen text-slate-100 p-8 md:p-12 bg-background">
        <App isOptionsPage={true} />
      </div>
    </ThemeProvider>
  </StrictMode>,
);
