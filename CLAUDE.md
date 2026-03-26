# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Google Sheets Add-on (Google Apps Script) that imports Google Calendar events into the active sheet via a sidebar UI. Internal use only — deployed to a Google Workspace domain, not published to the Marketplace.

## Development workflow

Edit locally, push to Apps Script with clasp:

```bash
npx clasp push        # push src/ to Apps Script
npx clasp open        # open the script editor in browser
```

There is no local test runner — testing requires opening the linked Google Sheet after each push, then using **Extensions > Calendar Importer > Open Calendar Importer**.

The `.clasp.json` (gitignored) holds the `scriptId`. Use `.clasp.json.template` as the starting point when setting up a new environment.

**First-time setup gotchas:**

- Run `onOpen()` manually once in the Apps Script editor to grant permissions and register the menu
- Enable **Google Calendar API** under Services in the Apps Script editor (Advanced Service, identifier `Calendar`)
- If `clasp push` fails with "Insufficient Permission", run `clasp logout && clasp login` to refresh OAuth scopes

## Architecture

Two files do everything:

**`src/Code.js`** — server-side Apps Script (runs on Google's servers):

- `onOpen()` — registers the Add-ons menu item
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

**`src/appsscript.json`** — manifest declaring OAuth scopes and the Advanced Calendar Service (`Calendar` v3). This file must be inside `src/` (the clasp `rootDir`).

## Key constraints

- **Apps Script execution limit: 6 minutes.** The `importEvents` function makes one `Calendar.Events.get()` call per unique recurring event series (to fetch the RRULE). Large imports with many recurring events can time out. The `rruleCache` object mitigates this within a single run.
- **Advanced Calendar Service required.** `CalendarApp` alone doesn't expose `creator`, `organizer`, or `recurrence` fields. The Advanced Service (`Calendar.Events.list`) must be enabled in the script editor under Services.
- **`singleEvents: true`** expands recurring event series into individual instances. Each instance links back to its master via `recurringEventId`.
- **OAuth scopes** in `appsscript.json`: `calendar.readonly`, `spreadsheets`, `script.container.ui`.

## Linked resources

- **Google Sheet:** `https://docs.google.com/spreadsheets/d/1MFaZCXDUrE8MKPlEg_jLaPrviUvQEr5-VA6sg0K1MRE`
- **Apps Script project:** `https://script.google.com/d/1N314c8s4aO0Yx8FrzMjAca57Ys--dbfrcTC7COJIFjBL4IB0oMecWC8x/edit`
