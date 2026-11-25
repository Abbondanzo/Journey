# Journey

A private, local-first log of everywhere you've been. Pin places by hand, or let Journey read your calendar and turn flights, hotel stays, trains and reservations into **trails** (trips and lists). Distance traveled, countries, nights away and patches are all computed from your own log.

- **Private first.** No account, no server, no public anything. Your log lives in this browser's IndexedDB.
- **Local first.** Calendar events are fetched straight from Google into the browser, parsed on the device, and never uploaded. The Google access token is kept in memory only.
- **You review before anything is saved.** Every proposed trail, flight, stay and visit can be unticked; unticked items can be remembered so they never come back.

> v2 is a rewrite. The 2018 React/Redux + Firebase web app and the Android/Flutter clients were removed; they remain in git history before this branch.

## Live

**https://abbondanzo.github.io/Journey/** is rebuilt and deployed by GitHub Actions (`.github/workflows/deploy.yml`) on every push to `master` (and to `v2-local-first` while it's in review): typecheck, tests, build, then publish to the `gh-pages` branch. Pull requests run the same checks without deploying. Add it to your home screen from the browser's share menu to use it like an app.

## Run it

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit, property-based and UI tests
pnpm build        # static site in dist/ (deploy to Cloudflare Pages or any static host)
```

No Google setup is needed to try the importer: **Import from calendar → Try it with a sample calendar** runs the full flow on a built-in messy calendar (duplicates, a cancelled trip, a rescheduled flight, everyday noise).

## Connecting Google Calendar

With accounts on (the deployed site), there's nothing to set up: **Import → Sign in with Google to connect** signs you in and asks for read-only calendar access in the same Google window. Later imports ask Google for a fresh token (they last an hour and stay in memory only). The Firebase project needs the Google Calendar API enabled and the `https://www.googleapis.com/auth/calendar.readonly` scope on its OAuth consent screen. Until Google verifies the app for that scope, people see a "Google hasn't verified this app" screen they can continue past.

A copy of Journey without accounts uses its own OAuth client instead:

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and **enable the Google Calendar API**.
2. **OAuth consent screen:** choose External, keep it in *Testing*, add your Google account as a test user, and add the calendar.readonly scope.
3. **Credentials → Create credentials → OAuth client ID → Web application**, with your site under *Authorized JavaScript origins* (and `http://localhost:5173` for development).
4. Paste the client ID into **Settings → Google OAuth client ID**, or set it as the `GOOGLE_CLIENT_ID` repository variable for the deploy workflow.

## Flighty

Flighty can export your whole flight history: in Flighty, **Settings → Export Flights → CSV**. It emails you the file; save it to Files, then in Journey choose **Import → Use a Flighty export** (or add it alongside your calendar on the next screen). Flights are matched against your calendar and anything already saved, even when the two use different airline codes (`UA 962` vs `UAL 962`), so nothing is counted twice. Cancelled flights are skipped and diverted ones count where they actually landed.

## Pinning a place by hand

Pinning a city, stay or visit also counts the distance to get there. If you were somewhere else in the last couple of days, it continues that trip from there and moves the assumed trip home to after the new stop. Otherwise it starts from where you lived at the time, worked out from your saved flights. If nothing is saved yet, type where you set off from (a city, or an airport code like `EWR`). These are straight-line estimates, marked as such; when real flights for the same trip arrive from your calendar or Flighty, they replace the estimates.

## How the calendar import works

`src/import/` is a pure, framework-free pipeline (`runImport(events, { existing })`):

1. **Normalise** (`src/google/normalize.ts`): Google events become `CalEvent`s with local calendar days, using each event's own time zone, so an overnight flight lands on the right dates.
2. **Extract** (`extract.ts`): each event becomes a flight / train / bus / ferry leg, a stay, a visit, or nothing. It understands Gmail's auto-added events (`Flight to Lisbon (TP 202)`, `Stay at …`, `Reservation at …`), TripIt-style titles (`UA123 EWR to SFO`), hand-made ones (`✈️ JFK → LIS`, `Hotel: Ace`, `Check-in: …`), several languages, and route details in descriptions. Reminders (`Book flight…`, `Online check-in opens`, `Pick up Mom from JFK`), recurring events, birthdays and out-of-office blocks are ignored.
3. **Dedupe** (`dedupe.ts`): the same event in several calendars (by iCalUID), the same flight seen through Gmail and TripIt (flight number + day, or route + time), check-in/check-out pairs, overlapping hotel blocks, cancellations (unless re-booked later) and reschedules (same confirmation code, latest version wins).
4. **Find where you lived** (`bases.ts`): there's no home airport setting. Legs joined by a change of planes (under 18 hours with no hotel; under 6 hours where you live; never an out-and-back) become one journey. Between journeys you're somewhere: where you landed, or, when a leg is missing from the data, where you landed and later where you set off from (split by how often you fly out of each). A timeline of homes is then chosen to be as cheap as possible overall: unbooked nights away from home cost 1 (at most two weeks' worth across a gap with a missing leg, since we don't know where that time went), booked nights away almost nothing, hotel nights at home 1, and a move costs about a month, so a home never lasts a few days and a trip whose flights there and back weren't tracked doesn't become one. You can tell it where you lived and when (review screen or Settings); those are taken as given.
   Flights-only exports also bring codeshare twins (same plane, two numbers), flights tracked twice or rebooked (A → B twice without leaving B): the one with your seat or record locator is kept.
5. **Group into trips** (`trips.ts`): a trip starts when you leave where you were based and ends when you arrive where you're based next; connections are never origins or destinations; flying into one city and sleeping in another (KIX → Kyoto) counts the city you slept in; stays without flights become estimated ground trips; restaurant bookings at home are left out. Trips are named after where you spent your nights (`Lisbon, Oct ’26`, `Kyoto & Tokyo, Apr ’25`, `Portugal, May ’26`); a one-way move is `To New York, Jun ’21`.
6. **Compare with what's saved**: every leg and entry has a fingerprint; re-importing adds only what's new, attaches it to the trail it belongs to, recognises things you logged by hand, and skips anything you dismissed.

Everything left out is listed on the review screen with the reason (duplicate, cancelled, rescheduled, already logged, not during a trip, couldn't tell where).

### Tests

- `src/import/*.test.ts`, `src/geo/*.test.ts`, `src/google/*.test.ts`: extraction tables (positives and false positives), place resolution, duplicates, cancellations, reschedules, layovers, multi-city and one-way trips, date-line crossings, re-imports.
- `src/import/properties.test.ts`: property-based tests with fast-check over generated travel histories. The import must be independent of event order, unchanged by copies in other calendars or reworded duplicates, unaffected by everyday events, idempotent after saving, and never propose the same item twice. Run more cases with `VITE_PROPERTY_RUNS=2000 pnpm test`.
- `src/ui/app.test.tsx`: the import and pin flows end to end against IndexedDB.

## Accounts and sync

Optional. With no Firebase project configured, Journey works entirely on the device, as above. With one, people can sign in with Google or GitHub and their trips follow them to every device.

- **Local first, still.** The app only ever reads the database on the device. `src/cloud/sync.ts` pushes each committed local change to Firestore and writes remote changes back, so the app works offline and catches up when it reconnects. Deletes travel as tombstones; the server's order settles conflicts (last write wins).
- **Atlases.** An atlas is one travel log. Everyone gets their own on first sign-in. The owner can share it with an invite link (Settings → Invite someone); whoever opens it sees who invited them, signs in, and joins. Roles are owner, editor and viewer. Each atlas has its own database on the device, and signing out removes the account's copies from that device.
- **First sign-in.** Trips already on the device move into the account. If the account already has trips from another device, Journey asks whether to add this device's too.
- **Rules.** `firestore.rules` enforces who can read and write what, including the invite flow. `src/cloud/cloud.emu.test.ts` checks it, and sync between two people, against the Firebase emulators in CI (`pnpm test:emu` under `firebase emulators:exec`).

To use your own project: create a Firebase project with Firestore and Google sign-in, add your site to Auth's authorized domains, deploy `firestore.rules`, and put the web app's config in `src/cloud/config.ts` (or a `FIREBASE_CONFIG` repository variable for the deploy workflow). GitHub sign-in also needs a GitHub OAuth app whose callback is `https://<project>.firebaseapp.com/__/auth/handler`.

## Not built yet

Sharing a single trail (rather than a whole atlas), photos on lists, .ics feeds (Apple / Outlook / TripIt subscriptions) and per-note privacy are designed but not in this version.

## Data

Airport and city tables are bundled so lookups work offline; see `src/data/ATTRIBUTION.md`. City data is from GeoNames (CC BY 4.0) via all-the-cities; airport data is from OurAirports (public domain).
