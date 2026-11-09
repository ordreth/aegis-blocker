import type { RuleInput } from "./types";

export interface Pack {
  id: string;
  rules: Pick<RuleInput, "kind" | "pattern">[];
}

const d = (pattern: string) => ({ kind: "domain" as const, pattern });
const p = (pattern: string) => ({ kind: "path" as const, pattern });

/** One-click starter lists. Names/descriptions live in the i18n catalogues. */
export const PACKS: Pack[] = [
  {
    id: "social",
    rules: [
      d("facebook.com"), d("instagram.com"), d("x.com"), d("twitter.com"),
      d("tiktok.com"), d("snapchat.com"), d("reddit.com"), d("pinterest.com"),
      d("tumblr.com"), d("threads.com"), d("threads.net"), d("bsky.app"),
    ],
  },
  {
    id: "shorts",
    rules: [
      p("youtube.com/shorts"), p("instagram.com/reels"), p("instagram.com/reel"),
      p("facebook.com/reel"), p("facebook.com/watch"), d("tiktok.com"),
    ],
  },
  {
    id: "video",
    rules: [
      d("youtube.com"), d("netflix.com"), d("twitch.tv"), d("primevideo.com"),
      d("disneyplus.com"), d("max.com"), d("hulu.com"), d("crunchyroll.com"),
    ],
  },
  {
    id: "chat",
    rules: [
      d("discord.com"), d("web.whatsapp.com"), d("web.telegram.org"),
      d("messenger.com"), d("slack.com"),
    ],
  },
  {
    id: "news",
    rules: [
      d("cnn.com"), d("foxnews.com"), d("bbc.com"), d("nytimes.com"),
      d("theguardian.com"), d("g1.globo.com"), d("uol.com.br"), d("news.google.com"),
    ],
  },
  {
    id: "games",
    rules: [
      d("store.steampowered.com"), d("steamcommunity.com"), d("epicgames.com"),
      d("roblox.com"), d("chess.com"), d("lichess.org"), d("miniclip.com"),
    ],
  },
  {
    id: "shopping",
    rules: [
      d("amazon.com"), d("aliexpress.com"), d("shein.com"), d("temu.com"),
      d("mercadolivre.com.br"), d("ebay.com"), d("shopee.com"),
    ],
  },
  {
    id: "memes",
    rules: [d("9gag.com"), d("imgur.com"), d("knowyourmeme.com"), p("reddit.com/r/memes"), p("reddit.com/r/funny")],
  },
];
