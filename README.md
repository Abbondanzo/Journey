# Journey

A private, local-first log of everywhere you've been. Pin places by hand, or let Journey read your calendar and turn flights, hotel stays, trains and reservations into **trails** (trips and lists). Distance traveled, countries, nights away and patches are all computed from your own log.

- **Private first.** No account, no server, no public anything. Your log lives in this browser's IndexedDB.
- **Local first.** Calendar events are fetched straight from Google into the browser, parsed on the device, and never uploaded. The Google access token is kept in memory only.
- **You review before anything is saved.** Every proposed trail, flight, stay and visit can be unticked; unticked items can be remembered so they never come back.

> v2 is a rewrite. The 2018 React/Redux + Firebase web app and the Android/Flutter clients were removed; they remain in git history before this branch.

## Run it

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit, property-based and UI tests
pnpm build        # static site in dist/ (deploy to Cloudflare Pages or any static host)
```

No Google setup is needed to try the importer: **Import from calendar → Try it with a sample calendar** runs the full flow on a built-in messy calendar (duplicates, a cancelled trip, a rescheduled flight, everyday noise).

## Connecting Google Calendar (one-time, ~2 minutes)

Journey has no backend, so it needs a Google OAuth client ID of your own:

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and **enable the Google Calendar API**.
2. **OAuth consent screen:** choose External, keep it in *Testing*, and add your Google account as a test user. Add the scope `https://www.googleapis.com/auth/calendar.readonly`.
3. **Credentials → Create credentials → OAuth client ID → Web application.** Under *Authorized JavaScript origins* add `http://localhost:5173` and your deployed URL (for example `https://journey.pages.dev`).
4. Paste the client ID into **Settings → Google OAuth client ID** in the app, or build with `VITE_GOOGLE_CLIENT_ID=… pnpm build`.

While the consent screen is in Testing, Google asks you to re-approve access about once a week; that's fine for personal use. Publishing for other people requires Google's verification for the calendar scope.

## How the calendar import works

`src/import/` is a pure, framework-free pipeline (`runImport(events, { home, existing })`):

1. **Normalise** (`src/google/normalize.ts`): Google events become `CalEvent`s with local calendar days, using each event's own time zone, so an overnight flight lands on the right dates.
2. **Extract** (`extract.ts`): each event becomes a flight / train / bus / ferry leg, a stay, a visit, or nothing. It understands Gmail's auto-added events (`Flight to Lisbon (TP 202)`, `Stay at …`, `Reservation at …`), TripIt-style titles (`UA123 EWR to SFO`), hand-made ones (`✈️ JFK → LIS`, `Hotel: Ace`, `Check-in: …`), several languages, and route details in descriptions. Reminders (`Book flight…`, `Online check-in opens`, `Pick up Mom from JFK`), recurring events, birthdays and out-of-office blocks are ignored.
3. **Dedupe** (`dedupe.ts`): the same event in several calendars (by iCalUID), the same flight seen through Gmail and TripIt (flight number + day, or route + time), check-in/check-out pairs, overlapping hotel blocks, cancellations (unless re-booked later) and reschedules (same confirmation code, latest version wins).
4. **Group into trips** (`trips.ts`): legs are split at home (inferred from your flights if not set); layovers under 24 hours aren't destinations; flying into one city and sleeping in another (KIX → Kyoto) counts the city you slept in; stays without flights become estimated ground trips; restaurant bookings at home are left out. Trips are named after where you spent your nights (`Lisbon, Oct ’26`, `Kyoto & Tokyo, Apr ’25`, `Portugal, May ’26`).
5. **Compare with what's saved**: every leg and entry has a fingerprint; re-importing adds only what's new, attaches it to the trail it belongs to, recognises things you logged by hand, and skips anything you dismissed.

Everything left out is listed on the review screen with the reason (duplicate, cancelled, rescheduled, already logged, not during a trip, couldn't tell where).

### Tests

- `src/import/*.test.ts`, `src/geo/*.test.ts`, `src/google/*.test.ts`: extraction tables (positives and false positives), place resolution, duplicates, cancellations, reschedules, layovers, multi-city and one-way trips, date-line crossings, re-imports.
- `src/import/properties.test.ts`: property-based tests with fast-check over generated travel histories. The import must be independent of event order, unchanged by copies in other calendars or reworded duplicates, unaffected by everyday events, idempotent after saving, and never propose the same item twice. Run more cases with `VITE_PROPERTY_RUNS=2000 pnpm test`.
- `src/ui/app.test.tsx`: the import and pin flows end to end against IndexedDB.

## Not built yet

Sync and sharing with friends, photos on lists, .ics feeds (Apple / Outlook / TripIt subscriptions) and per-note privacy are designed but not in this version.

## Data

Airport and city tables are bundled so lookups work offline; see `src/data/ATTRIBUTION.md`. City data is from GeoNames (CC BY 4.0) via all-the-cities; airport data is from OurAirports (public domain).
