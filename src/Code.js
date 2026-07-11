/**
 * Calendar Importer — Google Sheets Add-on
 * Imports Google Calendar events into the active sheet.
 */

function onOpen(e) {
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Open Calendar Importer', 'showSidebar')
    .addToUi();
}

/**
 * Runs when the add-on is installed from the Marketplace.
 * Calls onOpen so the menu appears immediately, without needing a sheet refresh.
 */
function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Calendar Importer');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Returns all calendars the user has access to.
 * @returns {Array<{id: string, name: string, color: string}>}
 */
function getCalendars() {
  return CalendarApp.getAllCalendars().map(cal => ({
    id: cal.getId(),
    name: cal.getName(),
    color: cal.getColor()
  }));
}

/**
 * Returns previously saved sidebar settings from user properties.
 * @returns {{startDate: string, endDate: string, selectedCalendarIds: string[], selectedColumns: string[]}}
 */
function getSavedSettings() {
  const props = PropertiesService.getUserProperties();
  const raw = props.getProperties();
  return {
    startDate:           raw.startDate           || '',
    endDate:             raw.endDate             || '',
    selectedCalendarIds: raw.selectedCalendarIds ? JSON.parse(raw.selectedCalendarIds) : null,
    selectedColumns:     raw.selectedColumns     ? JSON.parse(raw.selectedColumns)     : null
  };
}

/**
 * Imports events from the selected calendars into the active sheet.
 * @param {Object} params
 * @param {string}   params.startDate     ISO date string "YYYY-MM-DD"
 * @param {string}   params.endDate       ISO date string "YYYY-MM-DD"
 * @param {string[]} params.calendarIds
 * @param {string[]} [params.columns]     Column names to include; omit for all columns
 * @returns {{count: number, sheetName: string}}
 */
function importEvents(params) {
  const { startDate, endDate, calendarIds, columns, calendarNames } = params;

  // Build time bounds — end date is inclusive (push to end of day)
  const timeMin = new Date(startDate + 'T00:00:00').toISOString();
  const timeMax = new Date(endDate + 'T23:59:59').toISOString();

  const ALL_COLUMNS = [
    'Title', 'Start', 'End', 'All Day',
    'Description', 'Location', 'Attendees',
    'Calendar', 'Status', 'Creator', 'Organizer', 'Event ID',
    'Recurring', 'Recurrence',
    'Meet Link', 'Calendar Link', 'Original Start'
  ];

  // Determine which columns to write, preserving original order
  const selectedColumns = (columns && columns.length) ? ALL_COLUMNS.filter(c => columns.includes(c)) : ALL_COLUMNS;
  const colIndex = {};
  ALL_COLUMNS.forEach((c, i) => { colIndex[c] = i; });

  const rows = [];
  const rruleCache = {};  // key: calId + '|' + recurringEventId → human-readable string

  // Calendar names come from the client (already fetched via getCalendars());
  // fall back to the ID if a name wasn't passed for a calendar.
  const nameById = {};
  if (Array.isArray(calendarNames)) {
    calendarIds.forEach((id, i) => { nameById[id] = calendarNames[i]; });
  }

  for (const calId of calendarIds) {
    const calName = nameById[calId] || calId;
    let pageToken;

    do {
      const opts = {
        timeMin,
        timeMax,
        singleEvents: true,  // expand recurring events
        orderBy: 'startTime',
        maxResults: 2500
      };
      if (pageToken) opts.pageToken = pageToken;

      let response;
      try {
        response = Calendar.Events.list(calId, opts);
      } catch (e) {
        // Skip calendars we can't read (e.g. shared calendars with limited access)
        Logger.log('Skipping calendar %s: %s', calId, e.message);
        break;
      }

      for (const event of (response.items || [])) {
        // Skip cancelled events that were part of a recurring series
        if (event.status === 'cancelled') continue;

        const isAllDay = !event.start.dateTime;
        const start = isAllDay ? event.start.date : new Date(event.start.dateTime);
        const end   = isAllDay ? event.end.date   : new Date(event.end.dateTime);

        const attendees = (event.attendees || [])
          .filter(a => !a.self)   // exclude the calendar owner themselves
          .map(a => a.displayName ? `${a.displayName} <${a.email}>` : a.email)
          .join(', ');

        const isRecurring = !!event.recurringEventId;
        let recurrenceLabel = '';
        if (isRecurring) {
          const cacheKey = calId + '|' + event.recurringEventId;
          if (!(cacheKey in rruleCache)) {
            try {
              const master = Calendar.Events.get(calId, event.recurringEventId);
              const rruleLine = (master.recurrence || []).find(r => r.startsWith('RRULE:'));
              rruleCache[cacheKey] = rruleLine ? _parseRRule(rruleLine) : '';
            } catch (e) {
              rruleCache[cacheKey] = '';
            }
          }
          recurrenceLabel = rruleCache[cacheKey];
        }

        const meetLink = event.hangoutLink ||
          (event.conferenceData && event.conferenceData.entryPoints &&
           (event.conferenceData.entryPoints.find(e => e.entryPointType === 'video') ||
            event.conferenceData.entryPoints[0] || {}).uri) || '';

        const originalStart = event.originalStartTime
          ? (event.originalStartTime.dateTime
              ? new Date(event.originalStartTime.dateTime)
              : event.originalStartTime.date)
          : '';

        const fullRow = [
          event.summary    || '',
          start,
          end,
          isAllDay,
          event.description || '',
          event.location    || '',
          attendees,
          calName,
          event.status      || '',
          event.creator?.email   || '',
          event.organizer?.email || '',
          event.id,
          isRecurring,
          recurrenceLabel,
          meetLink,
          event.htmlLink || '',
          originalStart
        ];

        rows.push(selectedColumns.map(c => fullRow[colIndex[c]]));
      }

      pageToken = response.nextPageToken;
    } while (pageToken);
  }

  // --- Write to sheet ---
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.clearContents();
  sheet.clearFormats();

  // Header row
  const headerRange = sheet.getRange(1, 1, 1, selectedColumns.length);
  headerRange.setValues([selectedColumns]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#ffffff');

  // Data rows
  if (rows.length > 0) {
    const dataRange = sheet.getRange(2, 1, rows.length, selectedColumns.length);
    dataRange.setValues(rows);

    // Apply the date format to the Start/End columns in a single call
    const fmtRow = selectedColumns.map(c => (c === 'Start' || c === 'End') ? 'yyyy-mm-dd hh:mm' : '');
    dataRange.setNumberFormats(rows.map(() => fmtRow));
  }

  sheet.setFrozenRows(1);

  // Save settings for next session
  PropertiesService.getUserProperties().setProperties({
    startDate:           startDate,
    endDate:             endDate,
    selectedCalendarIds: JSON.stringify(calendarIds),
    selectedColumns:     JSON.stringify(selectedColumns)
  });

  return { count: rows.length, sheetName: sheet.getName() };
}

/**
 * Converts an RRULE string into a human-readable recurrence description.
 * e.g. "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE" → "Every 2 weeks on Mon, Wed"
 * @private
 */
function _parseRRule(rrule) {
  const DAY_NAMES = { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' };

  const parts = {};
  rrule.replace(/^RRULE:/, '').split(';').forEach(part => {
    const [k, v] = part.split('=');
    parts[k] = v;
  });

  const freq     = parts['FREQ']     || '';
  const interval = parseInt(parts['INTERVAL'] || '1', 10);
  const byDay    = parts['BYDAY']    || '';
  const byMonth  = parts['BYMONTH']  || '';
  const count    = parts['COUNT']    || '';
  const until    = parts['UNTIL']    || '';

  const freqLabel = {
    DAILY:   interval === 1 ? 'Daily'   : `Every ${interval} days`,
    WEEKLY:  interval === 1 ? 'Weekly'  : `Every ${interval} weeks`,
    MONTHLY: interval === 1 ? 'Monthly' : `Every ${interval} months`,
    YEARLY:  interval === 1 ? 'Yearly'  : `Every ${interval} years`
  }[freq] || freq;

  let label = freqLabel;

  if (byDay) {
    const days = byDay.split(',').map(d => {
      // Handle positional prefixes like 1MO, -1FR
      const match = d.match(/^(-?\d+)?([A-Z]{2})$/);
      if (!match) return d;
      const pos  = match[1];
      const name = DAY_NAMES[match[2]] || match[2];
      if (pos === '1')  return `1st ${name}`;
      if (pos === '2')  return `2nd ${name}`;
      if (pos === '3')  return `3rd ${name}`;
      if (pos === '-1') return `last ${name}`;
      return name;
    });
    label += ' on ' + days.join(', ');
  }

  if (byMonth) {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthName = MONTHS[parseInt(byMonth, 10) - 1] || byMonth;
    label += ' in ' + monthName;
  }

  if (count)  label += ` (${count}×)`;
  if (until)  label += ` until ${until.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}`;

  return label;
}
