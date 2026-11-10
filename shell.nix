# Development environment for NixOS / Nix users:  nix-shell
#
# Everything needed to build, test, audit and package the extension. Project
# dependencies (TypeScript 7, Vite, ...) are installed by pnpm from the lockfile:
#
#   pnpm install --frozen-lockfile
#
# Common tasks:
#   pnpm build && pnpm test      unit tests (no browser needed)
#   xvfb-run -a pnpm test:e2e    real-browser tests without a display (drop xvfb-run on a desktop)
#   pnpm assets                  regenerate store screenshots (headless Firefox)
#   pnpm zip                     release package
#   semgrep scan --metrics=off --config p/typescript src manifest.ts   static analysis (registry rules need network)
#   gitleaks git                 secrets in the git history
#   osv-scanner scan source -L pnpm-lock.yaml                          known-vulnerable dependencies (needs network)
{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  packages = with pkgs; [
    nodejs_24 # package.json "engines": node >= 24
    pnpm_11 # package.json pins pnpm 11.x; nixpkgs' default `pnpm` is already 12

    # Inspecting and packaging
    git
    jq
    ripgrep
    fd
    zip
    unzip

    # Real browsers: Chromium for `pnpm test:e2e`, Firefox for `pnpm assets`.
    # Extensions need a headed browser, so xvfb-run provides a virtual display.
    chromium
    firefox
    xvfb-run

    # Security tooling
    semgrep
    gitleaks
    osv-scanner
  ];

  shellHook = ''
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
    export AEGIS_CHROME="${pkgs.chromium}/bin/chromium"
    export AEGIS_FIREFOX="${pkgs.firefox}/bin/firefox"

    # nixpkgs may ship a slightly older pnpm 11 than the one in package.json.
    # Use it as is instead of trying to download and switch to the pinned one.
    export npm_config_manage_package_manager_versions=false
    export pnpm_config_manage_package_manager_versions=false

    echo "Aegis dev shell: node $(node -v), pnpm $(pnpm -v)"
  '';
}
