# Changelog

## 2.0.0

A ground-up rebuild focused on security, rigor and customization.

**Blocking**
- Rule kinds: site, page/section, word, regular expression; always-allow exceptions; schedules.
- Word and regex rules can also match page titles.
- Single-page-app navigations are caught; open tabs are swept when rules change.
- Quick packs for common distraction categories.

**Security**
- Service worker is the single source of truth; all actions are validated and checked against the lock.
- PBKDF2-SHA256 password hashing with throttling; recovery code never bypasses Absolute Mode.
- No more `tabs` permission; strict CSP with `connect-src 'none'`; data no longer synced to the cloud.
- Tampering with storage during Absolute Mode is reverted.

**Customization**
- Fully customizable block page (themes, layouts, local image/video background, quotes, buttons,
  redirect, temptation delay) with live preview.

**Other**
- New popup and dashboard, new icon, five languages, automatic migration from 1.x.
- Tooling: pnpm, TypeScript 7, Vite 8, Vitest, Playwright end-to-end tests.
