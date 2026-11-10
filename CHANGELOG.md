# Changelog

## 2.0.1

- Contact email (contact@ordreth.com) and website (https://ordreth.com/apps/aegis/) corrected.

## 2.0.0

A ground-up rebuild focused on security, rigor and customization.

**Blocking**
- Rule kinds: site, page/section, word, regular expression; always-allow exceptions; schedules.
- Word and regex rules can also match page titles.
- Single-page-app navigations are caught; open tabs are swept when rules change.
- Quick packs for common distraction categories.
- Addresses spelled with a root dot (`example.com.`) or escaped letters (`/%73horts`) are blocked too.
- Words that occur in every address (`tt`, `://`, `www`) are refused instead of blocking the whole web.

**Security**
- Service worker is the single source of truth; all actions are validated and checked against the lock.
- PBKDF2-SHA256 password hashing with throttling; recovery code never bypasses Absolute Mode.
- No more `tabs` permission; strict CSP with `connect-src 'none'`; data no longer synced to the cloud.
- Tampering with storage during Absolute Mode is reverted.
- Rules are evaluated by a matcher that cannot backtrack, so no rule, typed or imported, can stall
  the extension; requests are handled one at a time, so parallel password guesses cannot outrun
  the lockout.
- Tab checks are paced to one per second per tab. Word and regex rules can still be probed by a
  website that tests guesses; the rule editor recommends site or page rules for anything private.

**Customization**
- Fully customizable block page (themes, layouts, local image/video background, quotes, buttons,
  redirect, temptation delay) with live preview.

**Other**
- New popup and dashboard, new icon, five languages, automatic migration from 1.x.
- Tooling: pnpm, TypeScript 7, Vite 8, Vitest, Playwright end-to-end tests.
