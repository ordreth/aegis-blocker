# Privacy policy — Aegis Blocker

_Last updated: 2026-11-09_

Aegis Blocker does not collect, transmit, sell or share any data. It has no servers and no analytics.

**What Aegis processes locally.** To block what you ask it to block, Aegis compares the address (and,
for word rules that include page titles, the title) of the pages you open against the rules you
created. This happens inside your browser, in memory, and nothing about it is recorded or sent anywhere.
Aegis never reads the content of web pages and runs no code inside them.

**What Aegis stores.** Your rules, settings, block-page customization (including any image or video you
choose, kept in the browser's IndexedDB), the lock timer and — if you enable it — a salted hash of your
password and of your recovery code. All of it is stored in `chrome.storage.local` / IndexedDB on your
device only and is never synced to your Google account. Removing the extension deletes it.

**Network.** Aegis's own pages are forbidden from making network requests (`connect-src 'none'`).
Link buttons or a redirect on the block page are ordinary navigations that **you** configured and that
only happen when you click them (or when you enabled the automatic redirect).

**Permissions.** `declarativeNetRequest` (redirect blocked navigations to the block page), `storage`
(save your data locally), `alarms` (schedules, lock expiry, temporary unblocks) and access to http(s)
sites (required by the browser for redirects and to read the address of open tabs).

**Contact.** Open an issue at https://github.com/ordreth/aegis-blocker or use the private
vulnerability reporting described in SECURITY.md.
