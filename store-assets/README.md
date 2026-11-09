# Store assets

Everything needed for the Chrome Web Store listing and a presentation website. All images are
generated from the real UI — regenerate with `pnpm assets` (needs Firefox) after UI changes.

| File | Size | Use |
| --- | --- | --- |
| `icon-128.png` | 128×128 | Store icon (source: `public/assets/icon.svg`) |
| `screenshots/01…06-*.png` | 1280×800 | Store screenshots (24-bit PNG, no alpha) |
| `promo/small-440x280.png` | 440×280 | Small promo tile |
| `promo/marquee-1400x560.png` | 1400×560 | Marquee promo tile |
| `blockpage/*.png` | 1280×800 | Block page theme gallery (website / README / social) |

Screenshot captions, in upload order:

1. **Block the distraction, not the whole internet** — paths, words and always-allow exceptions.
2. **Every rule at a glance** — sites, sections, words and regex with schedules.
3. **One-click quick packs** — social, shorts, streaming, chat, news, games, shopping, memes.
4. **Design your own block page** — themes, layouts, your image or video, quotes and buttons.
5. **Absolute Mode** — a timed lock nothing can undo, enforced in the background.
6. **A block page that brings you back** — your words, your background, your next step.

## Listing text

### Short description (≤ 132 characters)

- **en** Block distracting sites, pages, words and patterns. Strict, private and 100% local: no servers, no tracking.
- **pt** Bloqueie sites, páginas, palavras e padrões que distraem. Rigoroso, privado e 100% local: sem servidores nem rastreamento.
- **es** Bloquea sitios, páginas, palabras y patrones que distraen. Estricto, privado y 100% local: sin servidores ni rastreo.
- **de** Blockiere ablenkende Seiten, Unterseiten, Wörter und Muster. Streng, privat und 100 % lokal: keine Server, kein Tracking.
- **zh_CN** 拦截令人分心的网站、页面、关键词和规则。严格、私密、100% 本地运行：无服务器，无追踪。

### Detailed description (en)

Aegis Blocker is a strict, private website blocker built for deep work and long study sessions.

Most blockers ban an entire site. Aegis blocks exactly what pulls you away — and leaves the useful
parts of the web open.

• Granular rules — block a whole site (reddit.com), one section (reddit.com/r/memes), a word
  (e.g. search terms) or a regular expression.
• Always-allow exceptions — block reddit.com but keep reddit.com/r/programming.
• Schedules — block only during work hours.
• Quick packs — social networks, short videos, streaming, chat, news, games, shopping, memes.
• Catches in-site navigation — blocks Shorts and Reels even when the page never reloads.
• Absolute Mode — a timed lock. You can still add blocks, but nothing can be removed or weakened
  until the timer ends.
• Optional password protection with a recovery code.
• Your own block page — themes, layouts, colors, your own image or video, quotes, link buttons,
  an automatic redirect and an optional "temptation delay".
• English, Português, Español, Deutsch, 简体中文.

Private by design: no accounts, no servers, no analytics, no remote code. Aegis's pages cannot even
make network requests. Everything is stored on your device. Open source (MIT).

Tip: enable "Allow in Incognito" for Aegis in chrome://extensions so private windows are covered too.

### Descrição detalhada (pt)

O Aegis Blocker é um bloqueador de sites rigoroso e privado, feito para trabalho profundo e longas
sessões de estudo.

A maioria dos bloqueadores bane o site inteiro. O Aegis bloqueia exatamente o que tira seu foco — e
mantém acessível o que é útil.

• Regras granulares — bloqueie um site inteiro (reddit.com), uma seção (reddit.com/r/memes), uma
  palavra (por exemplo, termos de busca) ou uma expressão regular.
• Exceções "sempre permitir" — bloqueie reddit.com mas mantenha reddit.com/r/programming.
• Horários — bloqueie só no expediente.
• Pacotes rápidos — redes sociais, vídeos curtos, streaming, chat, notícias, jogos, compras, memes.
• Pega navegação interna — bloqueia Shorts e Reels mesmo sem recarregar a página.
• Modo Absoluto — uma trava com tempo. Você ainda pode adicionar bloqueios, mas nada pode ser
  removido ou enfraquecido até o fim do timer.
• Proteção opcional por senha, com código de recuperação.
• Sua própria tela de bloqueio — temas, layouts, cores, imagem ou vídeo seu, frases, botões de link,
  redirecionamento automático e uma "pausa consciente" opcional.
• English, Português, Español, Deutsch, 简体中文.

Privado por design: sem contas, servidores, análises ou código remoto. As páginas do Aegis nem
conseguem fazer requisições de rede. Tudo fica no seu dispositivo. Código aberto (MIT).

## Chrome Web Store: "Privacy practices" answers

- **Single purpose:** Block websites, pages, words and patterns chosen by the user to help them stay focused.
- **declarativeNetRequest:** redirects navigations that match the user's rules to the extension's block page.
- **storage:** saves the user's rules, settings and block page customization locally on the device.
- **alarms:** re-evaluates schedules, ends the Absolute Mode timer and expires temporary unblocks.
- **Host permissions (http/https):** required by the browser to redirect matching navigations and to
  read the address (and title) of open tabs so rules also apply to pages already open and to in-site
  navigation. No page content is read and no scripts are injected.
- **Remote code:** none.
- **Data usage:** none collected; nothing is transmitted. Privacy policy: `PRIVACY.md`
  (https://github.com/ordreth/aegis-blocker/blob/main/PRIVACY.md).
