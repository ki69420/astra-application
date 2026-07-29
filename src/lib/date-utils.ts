/**
 * Formats a Date object, UTC ISO string, or timestamp into a clean "DD/MM/YYYY" string
 * for DatePickerInput. Always extracts UTC component to prevent timezone offsets.
 */
export function formatToSlashDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a Date object or ISO string into "15 Aug 2026".
 * Uses UTC component extraction to ensure dates never shift -1 day on Vercel/Node UTC servers.
 */
export function formatDisplayDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Parses DD/MM/YYYY digits into a UTC Noon ISO string (12:00:00.000Z).
 * Setting the UTC time to 12:00:00 (noon) ensures the calendar date (e.g. 15 Aug 2026)
 * falls on August 15 across EVERY timezone on Earth (UTC-12 to UTC+14).
 */
export function parseSlashDateToUTCNoonISO(formatted: string): string | null {
  const digits = formatted.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  ) {
    return utcDate.toISOString();
  }

  return null;
}
