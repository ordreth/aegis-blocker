import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { AegisProvider } from "@/ui/store";
import { OptionsApp } from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AegisProvider>
      <OptionsApp />
    </AegisProvider>
  </StrictMode>,
);
