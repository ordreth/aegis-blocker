import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 md:p-12">
      <App isOptionsPage={true} />
    </div>
  </StrictMode>
);
