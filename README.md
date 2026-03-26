# Calendar Importer

A Google Sheets Add-on (Google Apps Script) that imports Google Calendar events into the active sheet via a sidebar UI.

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

**First-time setup in the Apps Script editor:**
- Run `onOpen()` manually once to grant permissions and register the menu
- Enable **Google Calendar API** under Services (Advanced Service, identifier `Calendar`)

**Testing:** There is no local test runner. After each push, open the linked Google Sheet and use **Extensions > Calendar Importer > Open Calendar Importer**.

If `clasp push` fails with "Insufficient Permission", run `clasp logout && clasp login` to refresh OAuth scopes.

## Architecture

| File | Purpose |
|---|---|
| `src/Code.js` | Server-side Apps Script: menu, calendar fetch, event import, settings persistence |
| `src/Sidebar.html` | Client-side sidebar UI: date picker, calendar list, column selector |
| `src/appsscript.json` | Manifest: OAuth scopes, Advanced Calendar Service declaration |

**Key constraints:**
- Apps Script execution limit is **6 minutes**. Large imports with many recurring events can time out. An `rruleCache` mitigates repeated API calls within a single run.
- The **Advanced Calendar Service** (`Calendar` v3) must be enabled — `CalendarApp` alone doesn't expose `creator`, `organizer`, or `recurrence` fields.

## Publishing to Google Workspace Marketplace

The steps below cover everything required to publish this add-on publicly. Work through them in order — each phase depends on the previous one.

### Phase 1 — Google Cloud project

The default Apps Script project cannot be published to the Marketplace. You need a dedicated GCP project.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (e.g. `calendar-importer`).
2. In the Apps Script editor → Project Settings → Google Cloud Platform (GCP) Project, enter your new project number to link them.
3. In GCP, enable these APIs for the project:
   - Google Sheets API
   - Google Calendar API
   - Google Workspace Marketplace SDK

### Phase 2 — OAuth consent screen

1. In GCP → APIs & Services → OAuth consent screen, select **External** (required for public listing).
2. Fill in:
   - App name, support email, developer contact email
   - App logo (512×512 PNG)
   - **Privacy policy URL** (required — must be a real, publicly accessible page)
   - **Terms of service URL** (required for Marketplace)
3. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/script.container.ui`
4. Save and submit for **OAuth verification** (see Phase 3).

### Phase 3 — OAuth verification

Because the add-on requests sensitive scopes (`calendar.readonly`, `spreadsheets`), Google requires an OAuth verification review before the consent screen can be shown to users outside your domain.

**Requirements:**
- A working privacy policy page explaining what data is accessed and how it's used
- A demo video showing the add-on in action (YouTube link, unlisted is fine)
- A justification for each requested scope
- Possibly a **security assessment** by a Google-approved third party (triggered if your app exceeds 100 users or requests certain sensitive scopes)

**Timeline:** Typically 4–6 weeks. Submit early.

### Phase 4 — App logo and store assets

Prepare these before filling out the Marketplace listing:

| Asset | Size | Notes |
|---|---|---|
| App icon | 96×96 PNG | Shown in the add-on menu and listing |
| Large promo banner | 1400×560 PNG | Shown at the top of the listing |
| Screenshots | 1280×800 PNG | At least 1 required; up to 5 |

Update `appsscript.json` with your final hosted logo URL:
```json
"addOns": {
  "common": {
    "name": "Calendar Importer",
    "logoUrl": "https://your-domain.com/icon-96.png"
  },
  "sheets": {}
}
```

### Phase 5 — Marketplace listing

1. In GCP → APIs & Services → Google Workspace Marketplace SDK → App Configuration:
   - Set **App visibility** to Public
   - Set **App type** to Sheets add-on
   - Fill in short description (≤ 60 chars) and full description
   - Upload promo banner and screenshots
   - Add your privacy policy and ToS URLs
   - Set supported regions and languages
2. In the **Store Listing** tab, preview how the listing will appear.
3. Submit for **Marketplace review**. Google reviews the listing separately from OAuth verification — both must pass before the add-on goes live.

### Phase 6 — Publishing

Once both reviews are approved:

1. In the Marketplace SDK → App Configuration, click **Publish**.
2. The add-on appears at `https://workspace.google.com/marketplace/app/calendar_importer/<your-app-id>`.
3. Users install it from the Marketplace; it appears under **Extensions** in Sheets automatically.

### Summary checklist

- [ ] GCP project created and linked to Apps Script
- [ ] Google Sheets API, Calendar API, and Marketplace SDK enabled
- [ ] OAuth consent screen configured (External) with privacy policy and ToS URLs
- [ ] OAuth verification submitted and approved
- [ ] Logo and store assets prepared (96×96 icon, 1400×560 banner, screenshots)
- [ ] `appsscript.json` `logoUrl` updated to final hosted image
- [ ] Marketplace listing filled out and submitted for review
- [ ] Marketplace review approved
- [ ] Add-on published
