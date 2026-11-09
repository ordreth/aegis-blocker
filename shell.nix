# Development environment for NixOS / Nix users:  nix-shell
#
# Provides Node.js and pnpm. Project dependencies (TypeScript 7, Vite, ...) are
# installed by pnpm from the lockfile:  pnpm install --frozen-lockfile
{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  packages = with pkgs; [
    nodejs_24
    pnpm
    zip
    # Only needed for `pnpm test:e2e` and `pnpm assets` (headless browser runs).
    chromium
  ];

  shellHook = ''
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
    export AEGIS_CHROME="${pkgs.chromium}/bin/chromium"
    echo "Aegis dev shell: node $(node -v), pnpm $(pnpm -v)"
  '';
}
