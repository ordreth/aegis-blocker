# 🛡️ Aegis Blocker

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


* **Local-First & Private:** No data leaves your machine. No servers. No tracking. It runs 100% on your hardware.
* **Modern UI:** Built with a clean, dark-mode interface because protecting your peace shouldn't look ugly.
* **Zero Latency:** The blocking happens at the browser's API level (C++), not via heavy JavaScript injection.

## Forged With (Tech Stack)

This project wasn't just cobbled together; it was engineered with a modern stack:

* **Vite** - For lightning-fast builds.
* **React + TypeScript** - For type-safe UI development.
* **CRXJS** - The magic glue that makes Vite play nice with Chrome Extensions.
* **Shadcn UI + Tailwind CSS** - For that crisp, accessible aesthetic.
* **Chrome Manifest V3** - Future-proof extension architecture.

## How to Wield the Shield (Installation)

Since this is a personal tool, we run it in Developer Mode (for now).

1. **Clone the repo:**
```bash
git clone https://github.com/ordreth/aegis-blocker.git
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



## 🎮 Usage

1. Click the **Shield Icon** in your toolbar to open the quick popup.
2. Type a URL pattern (e.g., `twitter.com`, `youtube.com/shorts`).
3. Click **Add**.
4. Try to visit that link. You will be redirected to the "Blocked" screen.
5. *Optional:* Right-click the icon and hit "Options" for the full-screen dashboard.

## Future Plans (The "Hardcore" Mode)

Right now, Aegis relies on my own willpower not to disable it. In the future, I plan to implement:

* **Registry Locking:** Using Windows Group Policies to make the extension impossible to uninstall without a complex process.
* **Time-based Rules:** Only allowing Reddit after 6 PM.

## License

This project is open-source. Feel free to fork it, modify it, and forge your own shield.
