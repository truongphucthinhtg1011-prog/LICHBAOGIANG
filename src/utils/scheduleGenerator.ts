import { DayOfWeek, HolidayEntry, ScheduleEntry, SubjectCurriculum, TimetableSlot } from "../types";
import { calculateWeekDates } from "./dateUtils";

export interface GenerateOptions {
  timetable: TimetableSlot[];
  curriculums: SubjectCurriculum[];
  startDateSemester1: string;
  targetWeek: number;
  holidays: HolidayEntry[];
  customOverrides: Record<string, Partial<ScheduleEntry>>; // key: `w${weekNumber}_d${dayOfWeek}_s${session}_p${period}_${className}`
}

/**
 * Generate schedule entries for a specific target week by sequentially tracking
 * PPCT progression from Week 1 up to the target week.
 */
export function generateWeeklySchedule(options: GenerateOptions): ScheduleEntry[] {
  const {
    timetable,
    curriculums,
    startDateSemester1,
    targetWeek,
    holidays = [],
    customOverrides = {},
  } = options;

  // Build lookup map for curriculums by subject & class
  // key: `${subject.toLowerCase().trim()}_${className.toLowerCase().trim()}`
  // fallback key: `${subject.toLowerCase().trim()}`
  const curriculumMap = new Map<string, SubjectCurriculum>();
  curriculums.forEach((c) => {
    c.assignedClasses.forEach((cls) => {
      curriculumMap.set(`${c.subjectName.toLowerCase().trim()}_${cls.toLowerCase().trim()}`, c);
    });
    curriculumMap.set(c.subjectName.toLowerCase().trim(), c);
  });

  // Track the next lesson index (0-based) for each (class + subject)
  const classSubjectProgress = new Map<string, number>();

  // Helper to get progress key
  const getProgressKey = (className: string, subject: string) =>
    `${subject.toLowerCase().trim()}_${className.toLowerCase().trim()}`;

  // Holiday map by ISO date
  const holidayDateMap = new Map<string, string>();
  holidays.forEach((h) => {
    holidayDateMap.set(h.date, h.name);
  });

  // Sort timetable slots chronologically per week
  const sortedTimetable = [...timetable].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    if (a.session !== b.session) return a.session === "morning" ? -1 : 1;
    return a.period - b.period;
  });

  let currentTargetEntries: ScheduleEntry[] = [];

  // Simulate week-by-week from Week 1 to targetWeek
  for (let w = 1; w <= targetWeek; w++) {
    const weekInfo = calculateWeekDates(startDateSemester1, w);
    const isTargetWeek = w === targetWeek;
    const weekEntries: ScheduleEntry[] = [];

    // Loop through days Thứ 2 (2) -> Thứ 6 (6)
    for (let day = 2 as DayOfWeek; day <= 6; day = (day + 1) as DayOfWeek) {
      const dayInfo = weekInfo.days[day];
      const isHoliday = holidayDateMap.has(dayInfo.isoDate);
      const holidayReason = holidayDateMap.get(dayInfo.isoDate);

      // Filter timetable slots for this day
      const daySlots = sortedTimetable.filter((s) => s.dayOfWeek === day);

      daySlots.forEach((slot) => {
        const slotOverrideKey = `w${w}_d${slot.dayOfWeek}_s${slot.session}_p${slot.period}_${slot.className}`;
        const manualOverride = customOverrides[slotOverrideKey];

        const pKey = getProgressKey(slot.className, slot.subject);
        const currentIdx = classSubjectProgress.get(pKey) || 0;

        // Find curriculum for this class + subject
        const curriculum =
          curriculumMap.get(pKey) ||
          curriculumMap.get(slot.subject.toLowerCase().trim());

        let ppctPeriod: number | null = null;
        let lessonTitle = "";
        let equipment = "";
        let notes = "";

        if (isHoliday) {
          lessonTitle = `[${holidayReason || "Nghỉ lễ"}]`;
          notes = holidayReason || "Nghỉ lễ theo quy định";
        } else if (curriculum && curriculum.lessons.length > 0) {
          if (currentIdx < curriculum.lessons.length) {
            const lesson = curriculum.lessons[currentIdx];
            ppctPeriod = lesson.periodNumber;
            lessonTitle = lesson.lessonTitle;
            equipment = lesson.equipment || "";
            notes = lesson.notes || "";
            // Increment lesson pointer because class was taught
            classSubjectProgress.set(pKey, currentIdx + 1);
          } else {
            // Beyond curriculum length
            ppctPeriod = currentIdx + 1;
            lessonTitle = `Ôn tập / Hoạt động trải nghiệm`;
            classSubjectProgress.set(pKey, currentIdx + 1);
          }
        } else {
          // No curriculum provided yet for this subject
          ppctPeriod = currentIdx + 1;
          lessonTitle = `${slot.subject} ${slot.className}`;
          classSubjectProgress.set(pKey, currentIdx + 1);
        }

        if (isTargetWeek) {
          const entry: ScheduleEntry = {
            id: slotOverrideKey,
            weekNumber: w,
            dayOfWeek: slot.dayOfWeek,
            dateStr: dayInfo.dateStr,
            session: slot.session,
            period: slot.period,
            className: slot.className,
            subject: slot.subject,
            ppctPeriod: manualOverride?.ppctPeriod !== undefined ? manualOverride.ppctPeriod : ppctPeriod,
            lessonTitle: manualOverride?.lessonTitle !== undefined ? manualOverride.lessonTitle : lessonTitle,
            equipment: manualOverride?.equipment !== undefined ? manualOverride.equipment : equipment,
            notes: manualOverride?.notes !== undefined ? manualOverride.notes : notes,
            isHoliday: isHoliday,
            holidayReason: holidayReason,
            isCustomModified: !!manualOverride,
          };
          weekEntries.push(entry);
        }
      });
    }

    if (isTargetWeek) {
      currentTargetEntries = weekEntries;
    }
  }

  return currentTargetEntries;
}
