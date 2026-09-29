# The Billi Pepa Archive

A searchable companion to [thewildstarfires.com](https://thewildstarfires.com): the music, stories and photos of Billi Pepa and his bands — The Starfires, The Wild Starfires and The Front End (1964–1974), Pepa.Beads.Kydd, Jimmibeetles Rock Theatre (1994–2001) and The Wildstarfires catalog on Bandcamp and Spotify.

The official site stays the home base. This archive links back to it (every lyric lives there) and to Bandcamp, Spotify and YouTube.

Two pages, one data file:

- **`index.html` — Ask the archive (the engine).** The landing page. Visitors ask in their own words; Claude answers only from the archive; the photos appear in the chat, and the three cards (Top match, Shortlist with the score donut, Listing details) fill from the same data.
- **`guide.html` — The guide (the GUB).** The three bands, a timeline, a swipeable photo carousel, the Live album tracklist, a searchable list of every entry, and where to listen.
- **`data/gub.json` — the archive.** 36 entries (people, bands, records, songs, stories), photo captions and the timeline. Both pages and the chat read it.

Both pages have a light/dark switch and four text sizes, remembered in this browser. The guide opens light; the engine opens dark.

## What's in the folder

```
billi-pepa-archive/
├── index.html          Engine — the landing page
├── guide.html          Guide
├── api/chat.js         Server function: holds the key, picks entries, talks to Claude
├── data/gub.json       THE archive — edit this to add or fix anything
├── css/                engine.css, guide.css, lightbox.css
├── js/                 archive.js (loads the data), engine.js, guide.js, lightbox.js, prefs.js
├── assets/img/         Real photos and album art (compressed)
├── assets/favicon.svg
├── scripts/dev-server.js   Local preview that behaves like Vercel (not deployed)
├── vercel.json         Security headers, function settings
├── .env.example        Setting names, no values
└── README.md
```

## Look at it on your computer

The pages load `data/gub.json`, and browsers block that when a page is double-clicked from a folder (you'll see a message saying so). Instead:

1. Install Node.js 18 or newer if you don't have it.
2. Open a terminal in this folder and run:

```
node scripts/dev-server.js
```

3. Visit http://localhost:3000. Everything works — photos, carousel, full-screen viewer, theme, text size. The chat also works locally if you create a `.env.local` file with your key (see `.env.example`); it is ignored by Git.

## Put it on GitHub (GitHub Desktop)

1. Unzip and move the `billi-pepa-archive` folder where you keep projects.
2. GitHub Desktop → **File → Add local repository…** → choose the folder → **create a repository**.
3. **Publish repository** and leave **"Keep this code private"** ticked.
4. On github.com, open the repo → **Settings → Advanced Security** and turn on **Secret scanning** and **Push protection** (names can move; search the Settings page for "secret scanning").

## Put it online (Vercel)

1. Vercel → **Add New… → Project** → import the repo. No framework, no build command.
2. **Settings → Environment Variables**:
   - `ANTHROPIC_API_KEY` — Production only. Use a key made just for this project (see below).
   - `ANTHROPIC_MODEL` — optional. Leave empty to use `claude-sonnet-5`.
   - `ALLOWED_ORIGINS` — optional. Only if you add a custom domain *and* want another exact origin accepted, e.g. `https://www.example.com`. The site's own domain is always allowed.
3. **Deployments → Redeploy** (settings only apply to new deployments).

### The key, safely

- Create the key in its **own workspace** in the Claude Console, with a **monthly spend limit** and **spend alerts**. A leaked or abused key can then only spend that workspace's limit.
- Preview deployments get no key (or a separate low-limit one).
- The key is read only inside `api/chat.js`. It never appears in the pages, the browser, logs or this repo.

### Rate limit

`api/chat.js` allows 12 messages per visitor per minute, per server instance — a speed bump, not a wall. Add a real one in Vercel: **Project → Firewall → Configure → New Rule** → If *Request Path* equals `/api/chat` → Then **Rate Limit**, Fixed Window, 60 seconds, 20 requests, key IP → action 429. Vercel's docs list fixed-window rate limiting on all plans, with a limit on how many custom rules Hobby projects can have.

## What the chat checks

POST only (405 otherwise), JSON only (415), requests from other websites refused (403), bodies over 32 KB refused (413), at most 20 messages of 2,000 characters, only user/assistant roles. The server alone picks the model, token limit and instructions. Upstream calls time out at 25 seconds (the function may run 30). Errors come back as a plain `{ "error": "…" }`; only status codes are logged.

The Origin check stops *other websites* from using the chat. It does not stop scripts that fake headers — that's what the rate limit and the spend limit are for.

## Editing the archive

Everything lives in `data/gub.json`. Each entry has `id`, `collection` (`front-end`, `jbrt`, `wildstarfires`, `billi`), `kind`, `title`, `summary`, `body`, `tags`, `details`, `image`, `images`, `links` and `related`. Photo captions are in `photos`, the timeline in `timeline`.

To add a photo: put a JPG (about 1400 px on the long side) in `assets/img/`, add its caption to `photos`, and list it in an entry's `image` or `images`. Commit and push; the guide, the engine and the chat all pick it up.

## House rules the chat follows

- It only uses the archive, and says so when something isn't in it.
- **Who Jimmibeetles really was stays a mystery.** It never says or hints that Billi Pepa — or anyone — is Jimmibeetles.
- It gives no phone numbers or private details, and it always calls the video series AI-made.
- It treats the archive text and whatever visitors type as information, not instructions.

## What works and what doesn't

Works: every page, search, photos, the tracklist, and the chat once the key is set in Vercel. The chat can't answer until then — it shows a plain "not set up yet" message.

Not built: playing music, sales, email sign-ups, accounts or saved history. Those point to Bandcamp, Spotify, YouTube and the official site.

## Content sources

Billi Pepa's photo history and band pages on thewildstarfires.com, the liner notes and back covers of The Story of Jimmibeetles and the Best of The Wildstarfires volumes, the Bandcamp and Spotify pages, Rate Your Music for The Front End's singles, and heyjoecovers.fr for the Al Slavicsky article on the Jimmibeetles legend. All music and words © Billi Pepa / No Recollection Publishing, BMI.
