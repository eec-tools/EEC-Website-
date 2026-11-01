// Time helpers. All scheduling is defined in a local timezone (Asia/Kolkata by default)
// and stored as UTC.

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function localParts(date, tz) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: p.weekday.slice(0, 3).toLowerCase(),
  };
}

// "2026-11-09" + "09:30" in tz -> Date (UTC instant).
function zonedToUtc(dateStr, timeStr, tz) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) throw new Error(`Bad date "${dateStr}" (expected YYYY-MM-DD)`);
  if (!/^\d{2}:\d{2}$/.test(timeStr || "")) throw new Error(`Bad time "${timeStr}" (expected HH:MM)`);
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  let guess = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handle any fixed or DST offset.
  for (let i = 0; i < 2; i++) {
    const lp = localParts(new Date(guess), tz);
    const asUtc = Date.UTC(...lp.date.split("-").map((v, k) => (k === 1 ? Number(v) - 1 : Number(v))), lp.hour, lp.minute);
    guess += Date.UTC(y, m - 1, d, hh, mm) - asUtc;
  }
  return new Date(guess);
}

function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

// Monday of the week containing dateStr.
function mondayOf(dateStr) {
  const idx = DAY_KEYS.indexOf(weekdayOf(dateStr));
  return addDays(dateStr, idx === 0 ? -6 : 1 - idx);
}

// "22:00-07:00" -> true when the local time falls inside the window.
function inQuietHours(date, tz, window) {
  if (!window) return false;
  const m = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(window);
  if (!m) return false;
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  const lp = localParts(date, tz);
  const now = lp.hour * 60 + lp.minute;
  return start <= end ? now >= start && now < end : now >= start || now < end;
}

// Open slots for a channel in the week starting on `monday`, from the cadence config.
function cadenceSlots(cadence, channel, monday, tz) {
  const c = cadence[channel];
  if (!c || !c.days || !c.days.length) return [];
  const out = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    if (c.days.includes(weekdayOf(date))) out.push({ channel, date, time: c.time, slot_at: zonedToUtc(date, c.time, tz).toISOString() });
  }
  return out;
}

module.exports = { localParts, zonedToUtc, weekdayOf, addDays, mondayOf, inQuietHours, cadenceSlots, DAY_KEYS };
