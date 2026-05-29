export const WEEK_DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 7 },
];

export function isValidDateParts(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (year < 2024 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function buildScheduleTrigger({ year, month, day, hour, minute, repeatMode, selectedDays }) {
  const minutes = hour * 60 + minute;

  if (repeatMode === 'once') {
    return {
      m: minutes,
    };
  }

  return {
    m: minutes,
    d: getRepeatDaysBitmap(repeatMode, selectedDays),
  };
}

export function getRepeatDaysBitmap(repeatMode, selectedDays) {
  if (repeatMode === 'daily') {
    return 127;
  }

  if (repeatMode === 'weekdays') {
    return 31;
  }

  if (repeatMode === 'weekends') {
    return 96;
  }

  if (repeatMode === 'custom') {
    return selectedDays.reduce((bitmap, day) => bitmap | (1 << (day - 1)), 0);
  }

  return 0;
}

export function getRepeatLabel(repeatMode, selectedDays) {
  if (repeatMode === 'daily') {
    return 'Daily';
  }

  if (repeatMode === 'weekdays') {
    return 'On weekdays';
  }

  if (repeatMode === 'weekends') {
    return 'On weekends';
  }

  if (repeatMode === 'custom') {
    return `On ${formatDayBitmap(getRepeatDaysBitmap(repeatMode, selectedDays))}`;
  }

  return 'Once';
}

export function formatScheduleTrigger(trigger = {}) {
  const time = formatMinutes(trigger.m);

  if (Number.isInteger(trigger.dd)) {
    const year = trigger.yy || 'every year';
    const month = trigger.mm ? formatMonthBitmap(trigger.mm) : 'Date';
    return `${month} ${trigger.dd}, ${year} at ${time}`;
  }

  if (Number.isInteger(trigger.d)) {
    return `${formatDayBitmap(trigger.d)} at ${time}`;
  }

  if (Number.isInteger(trigger.ts)) {
    const date = new Date(trigger.ts * 1000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} at ${formatMinutes(date.getHours() * 60 + date.getMinutes())}`;
  }

  return `At ${time}`;
}

export function formatScheduleAction(action = {}) {
  const [deviceName, params = {}] = Object.entries(action)[0] || [];
  const [paramName, value] = Object.entries(params)[0] || [];

  if (!deviceName || !paramName) {
    return 'No action details';
  }

  return `${deviceName} ${paramName}: ${value ? 'ON' : 'OFF'}`;
}

export function formatMinutes(minutes) {
  if (!Number.isInteger(minutes)) {
    return '--:--';
  }

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function formatMonthBitmap(bitmap) {
  const monthIndex = Math.max(0, Math.round(Math.log2(bitmap || 1)));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames[monthIndex] || 'Date';
}

export function formatDayBitmap(bitmap) {
  if (bitmap === 127) {
    return 'Every day';
  }

  if (bitmap === 31) {
    return 'Weekdays';
  }

  if (bitmap === 96) {
    return 'Weekends';
  }

  if (bitmap === 0) {
    return 'Once';
  }

  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return names.filter((name, index) => bitmap & (1 << index)).join(', ');
}
