# Note Goat

A single-file, browser-only, domain-agnostic personal organizer. Where
[Project Manager](https://github.com/laustenfaund/ProjectManager) tracks one
kind of thing (construction projects) with a fixed set of tabs, Note Goat
is built for whatever a person actually needs organized — appointments,
doctors, medications, tasks, notes, or anything else — through user-named
modules instead of a fixed structure.

See [`DESIGN.md`](DESIGN.md) for the full reasoning behind every decision
below, including why this is its own app rather than a Project Manager
feature.

## Status: all 5 build phases complete

## What's built

- **Modules** — pick a pre-made template from the **Library** (a few generic
  starters, plus a first Medical pack: Doctors, Appointments, Referrals,
  Medications, Notes to Bring), describe what you need and let **AI propose
  one** (fields, and links to what you already have — reviewed and editable
  before anything is created), or build one yourself field by field
  ("Advanced," tucked below the AI option). Name it yourself; it joins the
  sidebar.
- **Records** — add, edit, delete records in any module, rendered
  appropriately for that module's shape (table, checklist, notes, or dated
  event). Every record gets a built-in Notes field automatically.
- **Cross-module links** — a field can link to one or many records in
  another module, always chosen manually. Any record's page shows what it
  links to *and* what links back to it (backlinks), each clickable. Deleting
  something with live backlinks warns first, naming the count; a link that
  goes stale another way shows as "no longer exists" rather than vanishing
  silently.
- **Sync** — per module, a shape-aware choice of Google Sheets / Docs /
  Calendar, reusing Project Manager's existing OAuth pattern (bring your own
  Google Cloud project). A combination that would silently lose meaning is
  refused outright with a reason; one that's just a lossy fit is offered
  with a disclosed warning first. One-way push only, same as the rest of
  the family — nothing is ever read back from Google. Calendar sync adds a
  popup reminder to every event by default (toggleable per module), and a
  dated module can add an optional Time field so a record syncs as a real
  timed event instead of all-day.
- **AI capture** — Quick Capture on the home page takes typed text and/or a
  photo, and an "AI clean up" pass turns it into one organized note for you
  to review before saving. Uses your own Anthropic key (Connections), same
  BYOK pattern as U/I and Archive Mole.
- **Home page** — four collapsed cards (Quick capture, Coming up, Next
  steps, Unanswered questions), each expanding to a full list on click.
- **Schema editing** — editing a module's fields after records already
  exist in it follows a confirm-then-refuse pattern: a field deletion or
  type change that would lose or corrupt data asks for confirmation or is
  refused outright with an error naming which records are the problem —
  never silently applied partway.
- **Settings** — one place (gear icon, sidebar) for your Anthropic key,
  Google Client ID / API key, and backup/transfer. Stored only in this
  browser; the Google sign-in itself doesn't persist across a reload, same
  as Project Manager.
- **Backup & transfer** — Export writes one portable file with every module
  and record (never your keys); Import reads one back in, replacing what's
  currently here, after confirming what it'll replace. That's how this
  moves between your phone and laptop with no account and no server — move
  the file yourself, however you'd move any file. Export can run
  automatically (Daily/Weekly, checked when you open the app — there's no
  such thing as a true background schedule for a closed browser tab) or
  stay Manual.
- **File / photo modules** — a fifth module shape: one uploaded file or
  photo per record, e.g. a scanned insurance card. Stored on this device
  in IndexedDB (not Drive), travels with Backup. Unrelated to Quick
  Capture's photo input — that one discards the photo and keeps only the
  AI-cleaned text; this keeps the actual file, on purpose, no AI involved.
- **Manual** — 📖 Manual (sidebar) opens a full walkthrough of every
  feature, same pattern as U/I's and Archive Mole's manuals, styled to
  match Note Goat's own colors.

Phase 5 is complete.

## Storage & privacy model

Same pattern as the rest of the family: everything lives in this browser's
`localStorage` on this device. No account, no server. The only network
calls are the direct ones you trigger yourself — an Anthropic API call for
AI capture/module setup, or a Google API call when you click Sync — using
keys you supply under Connections. Nothing routes through a server of ours.
Fonts ship with the app (`fonts/`), and Google's sign-in scripts load only
when you open Connections or a module's Sync window — opening and using the
app without sync contacts no outside site.

## Usage

Download `index.html` (or clone this repo) and open it directly in a
browser. No build step, no install.

## Installing on your phone

`manifest.json`, `sw.js`, and `icons/` make this app installable as a PWA
once hosted somewhere over `https://` (e.g. GitHub Pages) — a real app
icon (the watercolor stripe motif), a name, and a minimal offline shell
cache instead of just a bookmark.

1. Make sure this repo is public (Settings → Danger Zone → Change
   visibility), then enable GitHub Pages (Settings → Pages → Deploy from
   branch → `main` → `/` root).
2. Once it's live, open `https://laustenfaund.github.io/NoteGoat/`
   on your phone — not the repo's `github.com` page.
3. Use your browser's "Add to Home Screen" / "Install app" option.

## The hosted variant

[`hosted/`](hosted) is a clone of this same app with one change: instead of
each person pasting in their own Anthropic API key, AI capture and
AI-assisted module setup are gated by a passcode and routed through a
small proxy (in [`worker/`](worker)) that holds a single shared key
server-side, with hard per-person and total spending caps enforced before
any request goes out. Use this if you want to give a few people access to
the AI features without also giving them your API key.

This only covers the Anthropic connection — Google sync still needs each
person's own Google Cloud project and OAuth credentials in `hosted/`, same
as the plain version. Sync writes to *that person's own* Google account,
not a shared one, so there's no equivalent "use my Google connection"
version of that feature the way there is for the Anthropic key.

See [`worker/README.md`](worker/README.md) to deploy the proxy; the UI is
otherwise identical to the plain version above.

## License

All rights reserved — see [`LICENSE`](LICENSE). Shared for personal
reference; reuse requires asking first.
