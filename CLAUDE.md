# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Google Sheets Add-on (Google Apps Script) that imports Google Calendar events into the active sheet via a sidebar UI. **Published privately** to the Google Workspace Marketplace — installable only within the `supra.com.pe` domain (internal distribution; no public listing, no OAuth verification).

## Development workflow

Edit locally, push to Apps Script with clasp:

```bash
yes | npx clasp push   # push src/ to Apps Script
npx clasp open         # open the script editor in browser
```

Always push after making changes. There is no local test runner — testing requires opening the linked Google Sheet after each push, then using **Extensions > Calendar Importer > Open Calendar Importer**.

The `.clasp.json` (gitignored) holds the `scriptId` and the container Sheet ID. Use `.clasp.json.template` as the starting point when setting up a new environment.

> The `yes |` prefix is required because bare `clasp push` / `clasp version` hang on an interactive confirmation prompt in non-interactive shells. A human in a normal terminal can drop it.

**First-time setup gotchas:**

- Run `onOpen()` manually once in the Apps Script editor to grant permissions and register the menu
- Enable **Google Calendar API** under Services in the Apps Script editor (Advanced Service, identifier `Calendar`)
- If `clasp push` fails with "Insufficient Permission", run `clasp logout && clasp login` to refresh OAuth scopes

### Publishing a new version

The add-on is published privately on GCP project `calendar-importer-502115`. The loop for code changes:

1. Edit `src/`.
2. `yes | npx clasp push` — push to Apps Script.
3. `yes | npx clasp version "release notes"` — create a new numbered version.
4. Cloud Console → **Google Workspace Marketplace SDK → App Configuration** → Sheets integration → bump the **Version** field to the new number.
5. Click **Publish**.

## Architecture

Two Apps Script files do everything; `docs/` holds the Marketplace listing site.

**`src/Code.js`** — server-side Apps Script (runs on Google's servers):

- `onOpen()` — registers the Add-ons menu item
- `onInstall()` — calls `onOpen()` so the menu appears immediately on install (no sheet refresh needed)
- `getCalendars()` — returns all calendars via `CalendarApp`
- `getSavedSettings()` — reads last-used dates, calendar selection, and columns from `PropertiesService.getUserProperties()`
- `importEvents({startDate, endDate, calendarIds, columns})` — fetches events via the Advanced Calendar Service, filters to selected columns, writes to active sheet, then saves settings
- `_parseRRule(rrule)` — converts RRULE strings to human-readable recurrence labels

**`src/Sidebar.html`** — client-side HTML/CSS/JS rendered in the sidebar:

- Communicates with `Code.js` exclusively via `google.script.run.*` (async, callback-based)
- `checkedState` object is the source of truth for which calendars are selected — the DOM checkboxes mirror it, not the other way around
- Calendar list filtering uses CSS show/hide (not DOM rebuild) to avoid reflow
- Date presets: two-row toggle (Last/This/Next × Day/Week/Month/Quarter/Year); both rows must be selected to apply
- Column selector is collapsible; selected columns passed as array to `importEvents`; settings auto-saved on successful import

**`src/appsscript.json`** — manifest declaring OAuth scopes, the Advanced Calendar Service (`Calendar` v3), and add-on branding (`addOns.common.name` + `logoUrl`, pointing at the hosted icon). Must be inside `src/` (the clasp `rootDir`).

**`docs/`** — the public Marketplace listing site, served by **GitHub Pages** (the repo is public). Contains the homepage (`index.md`), privacy policy, terms of service, and all listing graphics (app icons, card banner, screenshots). Edit here → push → Pages rebuilds. Layout lives in `docs/_layouts/default.html`.

## Key constraints

- **Apps Script execution limit: 6 minutes.** The `importEvents` function makes one `Calendar.Events.get()` call per unique recurring event series (to fetch the RRULE). Large imports with many recurring events can time out. The `rruleCache` object mitigates this within a single run.
- **Advanced Calendar Service required.** `CalendarApp` alone doesn't expose `creator`, `organizer`, or `recurrence` fields. The Advanced Service (`Calendar.Events.list`) must be enabled in the script editor under Services.
- **`singleEvents: true`** expands recurring event series into individual instances. Each instance links back to its master via `recurringEventId`.
- **OAuth scopes** in `appsscript.json`: `calendar.readonly`, `spreadsheets`, `script.container.ui`. (`calendar.readonly` is a Sensitive scope, not Restricted — relevant only if public verification is ever pursued.)

## Marketplace publishing setup (in place)

- **GCP project:** `calendar-importer-502115` (no. `63344725750`), created **under the `supra.com.pe` organization**. Org placement is the prerequisite that enables the Internal OAuth consent screen and the Private Marketplace visibility — a "No organization" project will not work.
- **OAuth consent screen:** user type **Internal** (no verification needed).
- **Apps Script project** is linked to that GCP project (Project Settings → GCP Project Number).
- **Marketplace SDK → App Configuration:** visibility **Private**, type **Sheets add-on** (Editor add-on, referenced by script ID + version), the three OAuth scopes, developer info (Non-trader).
- **Marketplace SDK → Store Listing:** name, descriptions, icons, card banner, screenshots, privacy/ToS URLs, post-install tip. (Leave **Setup URL blank** — a value there triggers a spurious "additional setup required" post-install screen.)
- **APIs enabled:** Google Sheets API, Google Calendar API, Google Workspace Marketplace SDK (`gsuiteaddons.googleapis.com`).

The Marketplace SDK App Configuration and Store Listing are **console-only** (no API/gcloud). The Store Listing tab sometimes fails to load right after saving a draft — refresh, or reopen in an incognito session.

## Linked resources

The Google Sheet ID and Apps Script project ID are **not hardcoded here** — they live in `.clasp.json` (gitignored). Derive them:

- **Apps Script project:** `https://script.google.com/d/<scriptId>/edit` — `scriptId` is `.clasp.json`'s `scriptId`
- **Google Sheet:** `https://docs.google.com/spreadsheets/d/<parentId[0]>` — the Sheet ID is the first entry of `.clasp.json`'s `parentId` array

Fixed (non-secret) resources for this deployment:

- **GCP project:** `https://console.cloud.google.com/?project=calendar-importer-502115`
- **Marketplace SDK:** Cloud Console → APIs & Services → Google Workspace Marketplace SDK (project `calendar-importer-502115`)
- **Listing site (GitHub Pages):** `https://dr4gon123.github.io/calendar-importer/` — homepage, `/privacy-policy/`, `/terms-of-service/`, and listing graphics

Print the Sheet/Script links from `.clasp.json`:

```bash
jq -r '"Sheet:     https://docs.google.com/spreadsheets/d/" + .parentId[0], "Script:    https://script.google.com/d/" + .scriptId + "/edit"' .clasp.json
```
