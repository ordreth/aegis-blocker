import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "__MSG_appName__",
  short_name: "Aegis",
  description: "__MSG_appDesc__",
  default_locale: "en",
  version: pkg.version,
  minimum_chrome_version: "120",

  icons: {
    "16": "assets/icons/16.png",
    "32": "assets/icons/32.png",
    "48": "assets/icons/48.png",
    "128": "assets/icons/128.png",
  },

  action: {
    default_popup: "popup.html",
    default_title: "__MSG_appName__",
    default_icon: {
      "16": "assets/icons/16.png",
      "32": "assets/icons/32.png",
    },
  },

  options_ui: { page: "options.html", open_in_tab: true },

  background: { service_worker: "src/background/service-worker.ts", type: "module" },

  // No `tabs` permission: host access already exposes the URL/title of the
  // pages Aegis may block, and nothing else is read.
  permissions: ["declarativeNetRequest", "storage", "alarms"],
  host_permissions: ["http://*/*", "https://*/*"],

  web_accessible_resources: [
    { resources: ["blocked.html", "assets/*"], matches: ["http://*/*", "https://*/*"] },
  ],

  content_security_policy: {
    extension_pages: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join("; "),
  },
});
