import { DayOfWeek } from "../types";

export interface WeekDayInfo {
  dayOfWeek: DayOfWeek;
  dayName: string; // "Thứ Hai", "Thứ Ba"...
  shortName: string; // "Thứ 2", "Thứ 3"...
  dateStr: string; // "dd/mm/yyyy"
  isoDate: string; // "yyyy-mm-dd"
}

export interface WeekInfo {
  weekNumber: number;
  startDateStr: string; // "dd/mm/yyyy" (Thứ 2)
  endDateStr: string; // "dd/mm/yyyy" (Thứ 6)
  rangeText: string; // "Từ ngày 08/09/2025 đến ngày 12/09/2025"
  days: Record<DayOfWeek, WeekDayInfo>;
}

// Helper to pad 2 digits
export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

// Format Date object to "dd/mm/yyyy"
export function formatDateVN(date: Date): string {
  const d = padZero(date.getDate());
  const m = padZero(date.getMonth() + 1);
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Format Date object to "yyyy-mm-dd" (for HTML input type="date")
export function formatDateISO(date: Date): string {
  const d = padZero(date.getDate());
  const m = padZero(date.getMonth() + 1);
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

// Parse ISO date "yyyy-mm-dd" or fallback
export function parseISODate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  return new Date();
}

// Given the Monday of Week 1 and a weekNumber, compute Monday - Friday dates
export function calculateWeekDates(startDateSemester1: string, weekNumber: number): WeekInfo {
  const baseDate = parseISODate(startDateSemester1);

  // Ensure baseDate is aligned to Monday (if user picked another day, find Monday of that week)
  const currentDay = baseDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  baseDate.setDate(baseDate.getDate() + diffToMonday);

  // Calculate Monday of the target weekNumber: + (weekNumber - 1) * 7 days
  const mondayDate = new Date(baseDate.getTime());
  mondayDate.setDate(baseDate.getDate() + (weekNumber - 1) * 7);

  const dayNames: Record<DayOfWeek, { dayName: string; shortName: string; offset: number }> = {
    2: { dayName: "Thứ Hai", shortName: "Thứ 2", offset: 0 },
    3: { dayName: "Thứ Ba", shortName: "Thứ 3", offset: 1 },
    4: { dayName: "Thứ Tư", shortName: "Thứ 4", offset: 2 },
    5: { dayName: "Thứ Năm", shortName: "Thứ 5", offset: 3 },
    6: { dayName: "Thứ Sáu", shortName: "Thứ 6", offset: 4 },
  };

  const days = {} as Record<DayOfWeek, WeekDayInfo>;

  (Object.keys(dayNames) as unknown as DayOfWeek[]).forEach((dKey) => {
    const dayNum = Number(dKey) as DayOfWeek;
    const info = dayNames[dayNum];
    const targetDate = new Date(mondayDate.getTime());
    targetDate.setDate(mondayDate.getDate() + info.offset);

    days[dayNum] = {
      dayOfWeek: dayNum,
      dayName: info.dayName,
      shortName: info.shortName,
      dateStr: formatDateVN(targetDate),
      isoDate: formatDateISO(targetDate),
    };
  });

  const startDateStr = days[2].dateStr;
  const endDateStr = days[6].dateStr;

  return {
    weekNumber,
    startDateStr,
    endDateStr,
    rangeText: `Từ ngày ${startDateStr} đến ngày ${endDateStr}`,
    days,
  };
}

// Auto detect current week number based on today's date
export function detectCurrentWeek(startDateSemester1: string, totalWeeks: number = 35): number {
  try {
    const baseDate = parseISODate(startDateSemester1);
    const today = new Date();
    const diffMs = today.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    if (week < 1) return 1;
    if (week > totalWeeks) return totalWeeks;
    return week;
  } catch {
    return 1;
  }
}
