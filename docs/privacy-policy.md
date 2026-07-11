---
layout: default
title: Privacy Policy — Calendar Importer
permalink: /privacy-policy/
---

# Privacy Policy for Calendar Importer

**Last updated:** July 10, 2026

Calendar Importer ("the Add-on", "we", "us") is a Google Sheets add-on that imports
events from your Google Calendar into the active Google Sheet. This Privacy Policy
explains what data the Add-on accesses and how that data is handled.

By installing and using the Add-on, you agree to the practices described in this
Privacy Policy.

## 1. Who we are

The Add-on is developed and operated by Manuel Montesdeoca. For any questions about
this Privacy Policy or your data, contact:

**Email:** manuel.montesdeoca@supra.com.pe

## 2. What data we access and why

The Add-on requests the following Google API scopes. It only accesses the data
required to perform its function and nothing more.

| Scope | What it allows | Why it is needed |
|---|---|---|
| `https://www.googleapis.com/auth/calendar.readonly` | Read your Google Calendar events and calendars | To list your calendars and import the events you select into the sheet |
| `https://www.googleapis.com/auth/spreadsheets` | Read and write the active Google Sheet | To write the imported events into your sheet |
| `https://www.googleapis.com/auth/script.container.ui` | Display the sidebar user interface inside Google Sheets | To show the date range, calendar, and column picker |

When you run an import, the Add-on reads event details from your calendar (title,
start/end times, attendees, description, location, creator, organizer, recurrence,
meeting links, and similar fields that you choose) and writes only the columns you
select into the spreadsheet you have open.

## 3. How data is stored and processed

- **We do not operate our own servers for your data.** The Add-on runs on Google's
  infrastructure (Google Apps Script). Your calendar data is read by Google and
  written directly into your own Google Sheet. The data never passes through any
  server that we control.
- **Saved preferences.** The Add-on remembers your last-used date range, selected
  calendars, and selected columns so you do not have to re-enter them. These
  preferences are stored by Google via Apps Script user properties and are tied to
  your Google account; they are not transmitted to us.
- **No transmission to third parties.** We do not sell, rent, share, or otherwise
  disclose your data to any third party.
- **No advertising or analytics.** The Add-on does not include advertising trackers
  or third-party analytics. Your data is not used for advertising or profiling.

## 4. How long data is retained

- Imported events remain in your spreadsheet only for as long as you keep them
  there. Deleting the content or the sheet removes them.
- Your saved preferences are retained until you uninstall the Add-on or clear them
  through Google's Apps Script settings.

## 5. Your choices and rights

- **Uninstall.** You can uninstall the Add-on at any time from Google Sheets
  (Extensions → Add-ons → Manage add-ons), which revokes its access to your data.
- **Revoke access.** You can review and revoke the Add-on's permissions at any time
  in your Google Account security settings (https://myaccount.google.com/permissions).
- **Delete your data.** Delete the imported content from your sheet to remove the
  data. Uninstalling the Add-on removes your saved preferences.

## 6. Third-party services

The Add-on runs entirely within Google Workspace (Google Sheets and Google Calendar).
Your use of those services is governed by Google's Terms of Service and Privacy
Policy. We are not responsible for how Google handles your data under its own
policies.

## 7. Children's privacy

The Add-on is not directed to children under 13 (or the applicable age in your
country) and is not intended for their use. We do not knowingly collect data from
children.

## 8. Changes to this Privacy Policy

We may update this Privacy Policy from time to time. When we do, we will revise the
"Last updated" date at the top of this page. Material changes will take effect when
the updated policy is posted.

## 9. Contact

If you have any questions or requests regarding this Privacy Policy or your data,
please contact **manuel.montesdeoca@supra.com.pe**.
