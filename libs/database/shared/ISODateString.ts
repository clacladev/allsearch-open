/**
 * Represents a date string in the format YYYY-MM-DD.
 * It provides a compile-time check to ensure that the string has the correct format.
 */
export type ISODateString = `${number}-${number}-${number}`;

/**
 * Normalizes a date or string to an ISODateString (YYYY-MM-DD).
 */
export function getISODateString(date: Date | string, daysToAdd?: number): ISODateString {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date provided to toISODateString: ${date}`);
  }
  if (daysToAdd) {
    d.setDate(d.getDate() + daysToAdd);
  }
  return d.toISOString().split('T')[0] as ISODateString;
}

export function getTodayISODateString(): ISODateString {
  return getISODateString(new Date());
}

export function countDaysBetween(startDate: ISODateString, endDate: ISODateString): number {
  return Math.floor(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
}
