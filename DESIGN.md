# Note Goat — design notes

This document exists so the shape of the app doesn't have to be re-derived
from memory later, and so future changes can be checked against the
reasoning that produced them, not just the resulting feature list.

## What this is

A single-file, static, browser-only personal organizer: a domain-agnostic
version of the pattern Project Manager already proved out in one narrow
domain (construction projects), generalized to cover whatever someone
actually needs organized — starting concretely with one real need (a
friend's medical appointments, doctors, referrals, medications, and notes)
rather than designed abstractly for "as many cases as possible" first and
checked against a real need second.

It's the fourth app in the same family as Project Manager, U/I, and Archive
Mole, and it exists as its own app rather than a Project Manager feature for
a reason grounded in Project Manager's own design: PM's twelve tabs are
deliberately fixed, not pluggable, because "every project has exactly one
Budget" — they aren't a kind of thing you'd have several of. A personal
organizer is the opposite: appointments, doctors, medications, tasks, and
notes are all things a person has an unknown number of, in categories that
differ from person to person. That's a different problem than PM solved,
not a bigger version of the same one — so it gets its own app, the same way
U/I and Archive Mole did.

## Design principles inherited from the rest of the family

None of these are new; all four apps hold them in common, and every
decision below was checked against them:

- **Single portable HTML file.** No backend, no build step, no account
  system, no subscription. Opens from disk or hosted static, same file
  either way.
- **Local-first.** `localStorage` is the only source of truth. Anything
  external is a mirror, never authoritative.
- **One-way sync only, never two-way.** Two-way means conflict resolution,
  which means either a backend or real client-side complexity that a
  single-user tool doesn't need. Every sync path in this app pushes out and
  never reads back, same as PM's Sheets/Docx/Drive sync.
- **BYOK for AI, opt-in.** The person's own Anthropic API key, direct
  browser-to-API calls, no markup, nothing routed through a server of ours.
- **User-authored, never silently inferred.** Nothing gets categorized,
  linked, or profiled behind the person's back. An AI or the app itself can
  *suggest*; the person decides.
- **Honesty over polish.** Say when something didn't fully carry over or
  couldn't be determined, rather than quietly producing a confident-looking
  but degraded result.
- **Modularity only where the domain is genuinely open-ended.** PM
  restricts this to Special Orders because that's the one part of a
  construction project that's inherently unpredictable. This app's whole
  domain is that unpredictable, so modularity is the spine of the app
  instead of one corner of it — but the underlying restraint (don't make
  something configurable just because you can) still applies within each
  module: a module has a name and a field list, not an open-ended plugin
  architecture.

## Modules — the core primitive

A **module** is a user-named instance of a schema: a field list plus a
**shape**. The shape is what makes sync-target rules and cross-module
linking work generically instead of needing special-cased code per module:

| Shape | What it's for | Natural sync target |
|---|---|---|
| Repeating structured rows | A table of similar records (e.g. Medications) | Sheets |
| Freeform long text | Notes, journal-style entries | Docx |
| Checklist | Simple done/not-done items | Local-only, or a flattened Sheets table |
| Dated/scheduled event | Appointments, deadlines | Calendar |
| File/photo reference | Links to Drive-hosted files | Drive folder links |

Every module — regardless of shape — gets a **built-in notes field** on
each of its records, automatically, without the person having to add it
when they build a custom module. A separate, standalone **Personal Notes**
module (freeform-long-text shape) exists for notes that aren't attached to
any specific record at all. These are two different things: one is "notes
about this specific thing," the other is "notes about nothing in
particular."

### The Library

Modules are created from a **Library** section, reachable from the main
nav the same way PM's "manual" button is reachable today — but where
manual is read-only documentation, the Library is a picker. It shows:

- **Pre-made templates**, grouped into small clusters by common use (e.g.
  Health, Home & Auto, Finance) — editable after picking, not locked
  configurations.
- **Build your own**, starting from an empty field list, using the same
  underlying mechanism as picking a template.

The Library stays **fully browsable at all times**, not filtered down to
"things you haven't added yet" — someone may want a second instance of the
same template (e.g. "Doctor Visits" for two different family members' care,
even in the single-person v1 described below).

Selecting an item prompts the person to **name it themselves**, creates the
instance, and drops them into the module's main page. Once created, a
module joins the **persistent sidebar**, styled and positioned the same way
PM's tabs and Special Order categories are — the Library is only for
*adding* a module, not where you return to use one you've already set up.

### Editing a module's schema after records exist

Reuses the same two-tier disclosure already designed for sync compatibility
(below), applied to schema edits instead of sync targets:

- Edits that don't put existing data at risk — adding a field, reordering
  fields, a straightforward rename — apply immediately, no confirmation
  needed.
- Edits that do put existing data at risk — deleting a field, narrowing a
  field's type, changing the module's shape — show an **are-you-sure
  confirmation** naming exactly what's at stake before anything happens:
  "12 records have data in this field — deleting it removes that data
  permanently. Continue?"
- If, after confirming, the edit **actually can't be applied cleanly** to
  existing records — a type narrowing some existing values don't fit, a
  shape change that can't represent what's already there — the edit is
  **refused outright**, with an error naming which records and fields are
  the problem. Never applied partially, never silently drops the values
  that don't fit; the person fixes the offending data first or reconsiders
  the edit.

The stock app ships as a clean slate plus a small set of generic starter
modules (a basic checklist, a basic notes module, and **Unanswered
Questions** — see below) so a new install isn't a totally blank page, the
same way a new PM project starts pre-built rather than assembled from
parts. Domain-specific packs (Medical, described below, is the first) are
bundled into the same Library rather than distributed as separate files —
everything still ships in the one HTML file, consistent with the rest of
the family.

## Sync — per-shape rules, refuse or warn, never silently degrade

A module's shape determines which sync targets it's even offered:

- **Hard refuse** (option not offered at all) for combinations that would
  silently corrupt or lose the data's meaning — e.g. a checklist has no
  natural row identity for a Sheets round trip.
- **Soft warn** (offered, with an explicit disclosure) for combinations
  that are possible but a poor fit — e.g. syncing freeform notes to Sheets
  flattens structure into one cell per note. The warning says so before the
  person confirms, the same "disclose rather than smooth over" move U/I
  uses for incomplete translations.

Sheets/Docx/Drive sync reuses PM's existing mechanism exactly: the same
bring-your-own Google Cloud project, the same per-session OAuth connection
that doesn't persist across reloads, the same `findOrCreateFolder` pattern
so sync order doesn't matter. **Calendar sync** is a fourth API added to
that same connection — appointments (dated/scheduled-event shape) push out
on creation/edit, one-way, exactly like every other sync path here. Nothing
reads back from Google Calendar; an office rescheduling something there
doesn't reflect in the app, same tradeoff PM already made and documented
for Sheets.

Pushed events carry an explicit popup reminder (`useDefault: false`) rather
than falling back on whatever default the calendar happens to have — 9am
the day before for an all-day event (900 minutes before midnight), or 24
hours before for a timed one, since reminder minutes count back from event
start and a timed start needs the longer lead to still read as "the day
before." It's a per-module setting, stored on the module object the same
way `docId` is, defaulting to on so existing modules get it without
migration; the Sync screen's Reminder checkbox flips it per module.

A dated/scheduled-event module's Date field can be paired with an optional
**Time** field. A record with both pushes as a real timed event
(`start`/`end` as `{ dateTime, timeZone }`, one hour long, in the browser's
own timezone) instead of all-day; a record with only a date keeps pushing
all-day, unchanged — adding a Time field is additive and never breaks
existing records or already-synced events.

## Links between modules

The one thing with no precedent anywhere in the existing family — PM's
tabs and Special Order categories are siloed from each other; nothing
there to extend.

A module can have a **link field**, in two flavors: links-to-one (an
Appointment points at one Provider) and links-to-many (an Appointment
points at several Notes-to-Bring records). Links are always **manually
chosen by the person** from existing records — never inferred by matching
content, dates, or anything else. That keeps it consistent with the
user-authored principle: structured, but chosen.

Every record maintains a **backlink index** — not just what it links to,
but what links to *it*. This one piece of infrastructure does three things
at once:

1. Lets a hub record (a Provider) display everything that references it
   (its appointments, its medications) without duplicating that data.
2. Powers a **delete-time warning** — "3 records link to this, delete
   anyway?" — before removing something other records depend on.
3. Provides the fallback for links that go stale some other way: a
   dangling link is shown as "linked record no longer exists," disclosed
   rather than silently cleaned up or hidden.

**Any record's page**, opened from anywhere, shows the same recursive
shape: its own fields (including its notes) plus its linked and backlinked
items as clickable rows, each drilling into that specific record's own
page. This isn't special-cased per module — a Doctor's page showing its
appointments and referrals is the same mechanism as an Appointment's page
showing its notes-to-bring, applied generically.

## Home page

Deliberately small — **four cards**, not a dashboard trying to show
everything at once:

- **Quick capture** — the most visually prominent element on the page (see
  AI capture, below).
- **Coming up** — collapsed to a count plus the single soonest item ("Next:
  Dr. Smith, Tue 2pm — 3 more"), expands to the full list on click.
- **Next steps** — same collapsed/expand pattern.
- **Unanswered Questions** — things asked but not yet resolved (the
  personal-organizer analog of PM's Open Items / an RFI: a question that
  stays open until someone answers it, not until a date passes). This is
  domain-general, not medical-specific, so it ships as one of the stock
  app's starter modules rather than living only in the Medical pack.

A bare count is deliberately avoided in favor of showing one concrete item
alongside it — a number with no content can itself read as a small unknown
weight sitting on the page. Tone is quiet and neutral throughout: no
gamification (streaks, progress bars), no punitive framing for overdue
items ("3 overdue" reads the same as everything else, not as an alert), no
therapy-coded copy. The page should read as a well-designed organizer that
happens to work well for anyone who needs low-friction capture and clear
resurfacing of what's pending — not as an app that announces who it's for.

### Next Steps grouping

Grouped by **type**, without needing separate sections in the list itself:

- A next step **linked to something else** (a Referral, a Medication)
  inherits its group from that link — not a guess, just reading data
  that's already there.
- A **standalone** next step (nothing to derive a group from) gets a fast,
  low-friction manual tag at capture time — a keystroke/shorthand, not a
  dropdown or a second screen.

The list stays flat with a small type indicator (a colored dot or short
label) per item, plus an optional filter to narrow to one group — grouping
lives in the data and in an optional view, not in the page's default
layout.

## AI capture

The concrete use case that makes this the right time to add an AI feature
at all — PM's own design doc explicitly parked AI as "no concrete use case
chosen yet," and this is that use case: someone currently takes a photo of
chaotic notes and hands it to ChatGPT to organize.

**Scope is deliberately narrow**: photo or messy typed text goes in, one
clean, organized, legible **Personal Note** comes out, saved directly. That
is *not* the same as drafting typed records across several modules at
once — an earlier, wider version of this idea was set aside because it
would require the AI to understand the shape of every module in that
person's app, including custom ones they've built themselves, which is
brittle and gets harder to keep correct as the app changes under it. The
narrow version needs no module-schema awareness at all — it's the same
legibility task U/I already does well, just applied to messy input instead
of a message to send.

The person still builds whatever structured records they want (a Referral,
a Medication, a Next Step) out of the note themselves, through the normal
in-app flow — deliberately, the same as everywhere else in this app. The
one connective add-on: a structured record created from something in a
note can **link back to that note** as its source, using the same link
system as everything else, not new AI behavior.

This also keeps review friction low at the moment it matters most: one
clean note to skim and accept, right after an appointment, rather than
several separate draft cards to individually adjudicate.

## The Medical module pack

The first concrete Library pack, built for one real person's actual need
rather than as a generic proof of the module system:

- **Doctors** — the hub. Own fields: name, title/specialty, contact info,
  general notes. Everything else links *to* it; it doesn't contain
  anything.
- **Appointments** — dated/scheduled-event shape, links to one Doctor,
  pushes to calendar.
- **Referrals** — links to the referring and receiving Doctor, carries a
  status (pending/scheduled/completed) that behaves like an Unanswered
  Question: open until a follow-up Appointment exists and is linked to it.
  An unscheduled Referral surfaces as a "schedule this" Next Step
  (offered, one click, not created automatically) rather than needing its
  own calendar entry.
- **Medications** — repeating-rows shape, links to the prescribing Doctor
  and optionally the Appointment where it was prescribed or changed.
- **Notes to bring** — links to a specific upcoming Appointment; distinct
  from Personal Notes and from Unanswered Questions because it resolves
  when the appointment happens, not when someone answers it.

## Backup & transfer

A deliberate departure from PM and Archive Mole, both of which accept "no
export/backup, `localStorage` is the only copy" as a known risk rather than
solving it. Note Goat's single-person, cross-device use (one person's
own laptop and phone, no account, no server) makes that risk worth actually
addressing rather than inheriting by default.

**What a website can't do:** prevent a deliberate browser "clear site
data." That's a browser security boundary, not a limitation of this app —
no web app can architect around it. So the goal isn't preventing loss,
it's making loss trivially recoverable, and making the same data reach a
second device without a server.

**Export / Import, not sync.** Export produces one portable JSON file —
every module and every record, deliberately excluding the entire
`settings` object (API keys and the export-schedule choice itself stay
device-specific, never travel in a file that might get emailed or dropped
in a shared folder). Import reads one back in, replacing everything
currently in the app — a full restore, not a merge, avoiding the
conflict-resolution problem PM's one-way-sync design already decided
wasn't worth taking on. Import is always a manual, explicit action (pick a
file, confirm what it will replace) — never automatic, so this doesn't
become the automatic-read-back problem in a new shape.

**"Scheduled" export means checked-on-open, not backgrounded.** There is no
way for a closed, server-less page to wake itself on a clock — particularly
on iOS, which doesn't support the APIs that would even attempt it. Setting
Export to Daily or Weekly doesn't start a background timer; it means the
app compares now against the last export time once, at startup, and if
overdue, exports quietly right then with a toast, not a prompt. Practically
equivalent for someone who opens the app regularly (which this app is
built for), honestly different from true scheduling, and described that way
rather than implied otherwise.

**`navigator.storage.persist()`** is requested at startup as a real,
free mitigation for *automatic* eviction under disk pressure — a different
and much narrower problem than a deliberate clear, not a substitute for
the export/import path above.

## Known risks (accepted, not hidden)

- **A blank Library the first time someone opens it is still a cliff**,
  even with starter modules and the Medical pack — the stock app's
  advantage over a fully blank tool depends on the pre-made templates
  actually being good enough to start from without editing. Worth
  validating against the actual friend this was built for before assuming
  it generalizes.
- **AI capture quality depends entirely on the input's legibility.** A
  genuinely illegible photo produces a genuinely bad note; the app should
  say so rather than confidently producing a clean-looking note that
  quietly invented or dropped content — same honesty principle as U/I,
  not yet designed in detail here.
- **Custom modules built by a non-technical person can end up with awkward
  schemas** (wrong shape chosen, missing fields discovered later). Editing
  an existing schema is handled (see "Editing a module's schema after
  records exist," above) — the remaining risk is just that this makes
  fixing a bad initial choice slower than getting it right the first time
  would have been.
- **The backlink index adds real state to keep consistent** that nothing
  else in the family has needed before — it's the one piece of genuinely
  new infrastructure here, not a repackaging of an existing PM mechanism.

## Explicit non-goals (for now)

- **Multi-person/family support.** Every module and link in this document
  assumes one person's data in one flat scope, matching what was actually
  asked for. If this ever needs to hold a second person's data (a child,
  a parent), the right container is very likely a PM-style switchable
  "Project"-equivalent — a real design fork, not a default, and explicitly
  not attempted here.
- **Two-way sync of any kind**, calendar included — consistent with every
  other app in the family.
- **Auto-inferred module placement or categorization.** The AI capture
  feature produces one note, not a guess at where structured data belongs.
- **Live/synced connections between two people's copies of the app** — not
  needed for a single-person tool; U/I already has a considered-and-set-aside
  note on why this is a bigger fork than it looks.
- **A fully local/offline AI model** — same deferred status as U/I; BYOK
  Claude is the v1 mechanism.

None of these are ruled out permanently — they're out of scope for the
single-person, single-device design this document describes.
