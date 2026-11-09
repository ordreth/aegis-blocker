# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](https://github.com/ordreth/aegis-blocker/security/advisories/new)
rather than a public issue. You can expect an acknowledgement within a few days.

## Threat model

Aegis stores sensitive-feeling data (the list of things a person blocks) and offers a lock that is
meant to resist impulsive self-sabotage. The design goals, in order:

1. **Nothing leaves the device.** No servers, telemetry or remote code. Extension pages use
   `default-src 'self'; connect-src 'none'` (see `manifest.ts`), so even a bug in the UI cannot
   exfiltrate data over the network.
2. **A malicious web page or another extension must not be able to read or change Aegis state.**
   There are no content scripts and no `externally_connectable` entries; the only message
   listener is `runtime.onMessage` (own extension only) and every message is sender-checked,
   schema-validated and authorised. The only web-accessible resource is the block page, which
   renders user text with `textContent`, links only `http(s)` URLs and refuses to render when
   framed by a website (anti-clickjacking).
3. **Malware with local file access** can read the browser profile like any extension's storage;
   Aegis does not claim to defend against that. It does avoid making things worse: nothing is
   synced to cloud storage and passwords are stored only as salted PBKDF2 hashes.
4. **The owner acting on impulse** should find Absolute Mode hard to undo: the lock is enforced in
   the service worker (not just the UI), recovery codes are refused while locked, and edits made to
   storage behind the worker's back during a lock are reverted.

### Out of scope / known limits

- The owner (or anyone with their browser) can disable or uninstall the extension in
  `chrome://extensions`, or edit extension storage with developer tools *while no lock is active*.
  No extension can prevent this.
- During a lock, a determined user with DevTools access to extension pages could still defeat the
  tamper guard (it keeps its reference copy in memory-only storage that DevTools can also write).
  This is a deliberate trade-off: the guard defends against casual and impulsive bypasses.
- The block page is web-accessible so declarativeNetRequest can redirect to it; a website that
  knows the extension id can therefore probe whether Aegis is installed.
- Keyword and regex rules can be probed. They apply to any address or title, so a page can put a
  guess in its own title or URL and watch whether it gets blocked, learning that word. Tab checks
  are paced to one per second per tab, which slows this down but does not prevent it. Site and
  page rules only react to their own address and cannot be probed this way: use them for anything
  sensitive (the rule editor says so).
- The lock is timed with the computer's clock. Whoever can set the clock forward can end it.
- An address spelled with escaped letters (`/%73horts`) is not seen by the browser's own filter; the
  service worker catches it on the tab, a moment after the page starts loading.

## Hardening in v2

- Password hashes: PBKDF2-SHA256, 600 000 iterations, 16-byte random salt, constant-time compare,
  lockout back-off (30 s doubling up to 15 min after 5 failures). v1's single-round SHA-256 hashes
  are upgraded on first successful login and the recovery code is rotated.
- Data in `chrome.storage.sync` (v1) is migrated to `storage.local` and deleted from sync, but only
  after it has been read: if sync is unavailable the migration waits instead of dropping the password.
- Rules are matched in the service worker by a matcher that cannot backtrack (time bounded by pattern
  size × text length), so no rule, typed or imported, can stall it. Regular expressions are also
  length-limited, rejected if they repeat a group (`(a|b)+`), stack more than four quantifiers, or use
  look-around or back-references, must be RE2-compatible, and must not match every URL.
- Requests to the service worker are handled one at a time, so parallel password guesses cannot get
  ahead of the lockout.
- Imports: size-limited, schema-validated, re-normalised; at most 900 rules.
- Snooze ("temptation delay") only unblocks the exact address the matching rule blocked.
- Dependencies are installed with pnpm, `minimumReleaseAge` and `strictDepBuilds`; lifecycle scripts
  are not run unless explicitly allow-listed.
