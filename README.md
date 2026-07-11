# Calendar Importer

A Google Sheets Add-on (Google Apps Script) that imports Google Calendar events into the active sheet via a sidebar UI. Distributed internally via a **Private** Google Workspace Marketplace listing (`supra.com.pe` only).

## What it does

Open the sidebar from **Extensions > Calendar Importer > Open Calendar Importer**, pick a date range, select which calendars and columns to include, and click **Import Events**. Events are written directly into the active sheet.

Available columns: Event ID, Title, Start, End, All Day, Description, Location, Creator, Organizer, Attendees, Status, Recurring, Recurrence, Meet Link, Calendar Link, Original Start, and more.

## Development setup

**Prerequisites:** Node.js, a Google account with access to the linked Apps Script project.

```bash
npm install
npx clasp login
cp .clasp.json.template .clasp.json   # fill in your scriptId
npx clasp push                         # push src/ to Apps Script
npx clasp open                         # open the script editor in browser
```

> If `clasp push` / `clasp version` hang in a non-interactive shell, prefix with `yes |` — e.g. `yes | npx clasp push`.

**First-time setup in the Apps Script editor:**
- Run `onOpen()` manually once to grant permissions and register the menu
- Enable **Google Calendar API** under Services (Advanced Service, identifier `Calendar`)

**Testing:** There is no local test runner. After each push, open the linked Google Sheet and use **Extensions > Calendar Importer > Open Calendar Importer**.

If `clasp push` fails with "Insufficient Permission", run `clasp logout && clasp login` to refresh OAuth scopes.

## Architecture

| File | Purpose |
|---|---|
| `src/Code.js` | Server-side Apps Script: menu (`onOpen`/`onInstall`), calendar fetch, event import, settings persistence |
| `src/Sidebar.html` | Client-side sidebar UI: date picker, calendar list, column selector |
| `src/appsscript.json` | Manifest: OAuth scopes, Advanced Calendar Service, add-on branding (`logoUrl`) |
| `docs/` | Marketplace listing site (GitHub Pages): homepage, privacy policy, terms of service, app icons, card banner, screenshots |

**Key constraints:**
- Apps Script execution limit is **6 minutes**. Large imports with many recurring events can time out. An `rruleCache` mitigates repeated API calls within a single run.
- The **Advanced Calendar Service** (`Calendar` v3) must be enabled — `CalendarApp` alone doesn't expose `creator`, `organizer`, or `recurrence` fields.

## Distribution & publishing

Calendar Importer is distributed **internally** via a **Private** Google Workspace Marketplace listing — only `supra.com.pe` users can install it. (Public publishing was skipped: it requires OAuth verification plus hosting the homepage/privacy policy on a verified, owned domain — and a 4–6 week review.)

**In place on GCP project `calendar-importer-502115` (under the `supra.com.pe` org):**
- OAuth consent screen — user type **Internal** (no verification).
- Marketplace SDK → **App Configuration** — visibility **Private**, type **Sheets add-on** (Editor add-on, referenced by Apps Script project ID + version), the three OAuth scopes.
- Marketplace SDK → **Store Listing** — name, descriptions, icons, card banner, screenshots, privacy/ToS URLs.
- APIs enabled: Google Sheets API, Google Calendar API, Google Workspace Marketplace SDK.
- The listing's homepage, privacy policy, terms of service, and graphics are served from this repo via **GitHub Pages** (`docs/`).

### Publishing a new version

```bash
yes | npx clasp push                       # push code to Apps Script
yes | npx clasp version "release notes"    # create a new numbered version
```

Then Cloud Console → **Google Workspace Marketplace SDK → App Configuration** → bump the **Version** field → **Publish**.

### Install (end users)

Open a Google Sheet → **Extensions → Add-ons → Get add-ons** → search **Calendar Importer** → install → **Extensions → Calendar Importer → Open Calendar Importer**.
