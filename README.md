<div align="center">
  <img width="128" height="128" alt="aegies-blocker-logo" src="https://github.com/user-attachments/assets/d7abe73d-1027-4c43-8419-d4818fe6e3f7" />
  <h1>Aegis Blocker</h1>
  <p>
    <strong>Focus Guard for Deep Work</strong>
  </p>
</div>

> *"The Aegis... which produced a sound as from a myriad roaring dragons."* — The Iliad

**Aegis Blocker** is a custom-built, granular browser extension designed to defend your attention span against the modern-day Hydras: **Brain-rot, Doomscrolling, and Distractions.**

## The Origin Story

In Greek mythology, the Aegis was a shield carried by Athena and Zeus, offering ultimate protection.

In the digital world, I needed a shield too. I didn't want to install shady, "black-box" parental control software that spies on my traffic. I just wanted to stop myself from spiraling into `youtube.com/shorts` or specific subreddits while trying to focus on code and studies.

Existing tools were too blunt—they blocked the *whole* site. I needed something smarter. I needed to block the "brain-rot" (`instagram.com/reels`) while keeping the useful parts of the internet accessible.

So, I forged my own shield.

## What makes this different?

* **Granular Precision:** Unlike `/etc/hosts` which nukes entire domains, Aegis uses the Chrome `declarativeNetRequest` API to block specific *paths*.
  * **Allow:** `reddit.com/r/programming`
  * **Block:** `reddit.com/r/memes`


* **The "Nuclear" Option (Quick Block):** Caught doomscrolling? One click detects the current site and bans it instantly.
* **Absolute Mode:** Need deep focus? Activate the **24-hour Lock**. You can add new rules, but you **cannot remove** existing ones until the timer runs out. No take-backs.
* **Active Sanitization:** When you ban a site, Aegis instantly hunts down and redirects any open tabs matching that URL.
* **Multi-Profile Sync:** Export your rules as JSON and import them to your Work, Personal, or other browser profiles.
* **Local-First & Private:** No data leaves your machine. No servers. No tracking. It runs 100% on your hardware.

## Tech Stack

This project wasn't just cobbled together; it was engineered with a modern stack:

* **Vite** - For lightning-fast builds.
* **React + TypeScript** - For type-safe UI development.
* **CRXJS** - The magic glue that makes Vite play nice with Chrome Extensions.
* **Shadcn UI + Tailwind CSS** - For that crisp, accessible aesthetic.
* **Chrome Manifest V3** - Future-proof extension architecture.

## Installation

Since this is a personal tool, we run it in Developer Mode.

1. **Clone the repo:**
```bash
git clone https://github.com/DiegoAndradeD/aegis-blocker.git
cd aegis-blocker

```


2. **Install dependencies:**
```bash
npm install

```


3. **Forge the build:**
```bash
npm run build

```


*This creates a `dist` folder with the compiled extension.*

4. **Equip in Chrome:**
* Open `chrome://extensions`.
* Enable **Developer mode** (top right toggle).
* Click **Load unpacked**.
* Select the `dist` folder.
* **CRITICAL STEP:** Click "Details" on the extension and enable **"Allow in Incognito"**. (Otherwise, you can cheat by opening a private window).



## Usage

### Basic Defense

1. Click the **Shield Icon** in your toolbar.
2. Type a URL pattern (e.g., `twitter.com`, `youtube.com/shorts`).
3. Click **Add**.
4. Any open tab matching that pattern is instantly redirected to the "Focus" screen.

### The Nuclear Option (Quick Block)

If you are currently browsing a site you shouldn't be (e.g., TikTok):

1. Open the extension popup.
2. A large red button will appear: **"Block tiktok.com now"**.
3. Click it. The tab closes instantly.

### Absolute Mode (The Lock)

1. Click the **Unlock Icon** in the header.
2. Confirm that you want to lock your settings for **24 Hours**.
3. The UI turns red, and a countdown begins.
4. **Result:** You can *add* new blocks, but the "Delete" buttons are disabled until the timer expires.

### Backup & Sync

* **Download:** Click the ⬇️ icon to save your rules as a JSON file.
* **Upload:** Click the ⬆️ icon to load rules into a different browser profile.

## Interface & Preview

A minimalist shield for a distracted mind. The UI is designed to stay out of your way while providing all the tools you need to regain control.

<div align="center">
  <img width="1423" height="998" alt="aegis-blocker-preview" src="https://github.com/user-attachments/assets/d1aa72fb-561e-4617-b2b1-66feac627f50" />
  <p><em>The Aegis Dashboard: Clean, intuitive, and ruthless against distractions.</em></p>
</div>

---

## License

This project is open-source. Feel free to fork it, modify it, and forge your own shield.

---

*"Focus on what matters. Let the Aegis handle the rest."*
