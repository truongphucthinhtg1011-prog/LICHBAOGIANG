import * as XLSX from "xlsx";
import {
  HolidayEntry,
  ScheduleEntry,
  ScheduleTemplateConfig,
  SubjectCurriculum,
  TeacherProfile,
  TimetableSlot,
} from "../types";
import { calculateWeekDates, WeekInfo } from "./dateUtils";
import { generateWeeklySchedule } from "./scheduleGenerator";
import { DEFAULT_TEMPLATE } from "./templateParser";

/**
 * Format entry value based on column key
 */
function getEntryCellValue(entry: ScheduleEntry, key: string): string | number {
  switch (key) {
    case "dayOfWeek":
      return `Thứ ${entry.dayOfWeek} (${entry.dateStr})`;
    case "session":
      return entry.session === "morning" ? "Sáng" : "Chiều";
    case "period":
      return entry.period;
    case "className":
      return entry.className;
    case "subject":
      return entry.subject;
    case "ppctPeriod":
      return entry.ppctPeriod !== null && entry.ppctPeriod !== undefined ? entry.ppctPeriod : "";
    case "lessonTitle":
      return entry.lessonTitle || "";
    case "equipment":
      return entry.equipment || "";
    case "notes":
      return entry.notes || "";
    default:
      return "";
  }
}

/**
 * Build sheet rows for a specific week given schedule entries and a template
 */
function buildWeekSheetRows(
  entries: ScheduleEntry[],
  weekInfo: WeekInfo,
  profile: TeacherProfile,
  template: ScheduleTemplateConfig = DEFAULT_TEMPLATE,
  includeTitle = true
): (string | number | null)[][] {
  const visibleCols = template.columns.filter((c) => c.visible);
  const rows: (string | number | null)[][] = [];

  const school = template.schoolName || profile.schoolName || "TRƯỜNG TIỂU HỌC";
  const upper = template.upperDepartment || "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO";
  const dept = template.departmentName || profile.department || "TỔ CHUYÊN MÔN";
  const title = template.documentTitle || "LỊCH BÁO GIẢNG";

  if (includeTitle) {
    // School and Motto Headers
    rows.push([upper, null, null, null, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"]);
    rows.push([school, null, null, null, "Độc lập - Tự do - Hạnh phúc"]);
    rows.push([dept, null, null, null, ""]);
    rows.push(["", null, null, null, ""]);

    // Main Schedule Title
    rows.push([`${title} - TUẦN ${weekInfo.weekNumber}`, null, null, null, ""]);
    rows.push([`(${weekInfo.rangeText} | Năm học: ${profile.academicYear})`, null, null, null, ""]);
    rows.push([
      `Giáo viên: ${profile.fullName}  |  Tổng số tiết: ${entries.filter((e) => !e.isHoliday).length} tiết/tuần`,
      null,
      null,
      null,
      "",
    ]);
    rows.push(["", null, null, null, ""]);
  }

  // Column Headers
  const colHeaders = visibleCols.map((c) => c.label);
  rows.push(colHeaders);

  // Data Rows
  entries.forEach((entry) => {
    const rowValues = visibleCols.map((col) => getEntryCellValue(entry, col.key));
    rows.push(rowValues);
  });

  // Footer & Signatures
  if (template.showSignatureBlock) {
    const today = new Date();
    const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    rows.push(["", null, null, null, ""]);
    rows.push(["", null, null, null, dateStr]);
    rows.push([template.signerLeftRole, null, null, null, template.signerRightRole]);
    rows.push([template.signerLeftNote, null, null, null, template.signerRightNote]);
    rows.push(["", null, null, null, ""]);
    rows.push(["", null, null, null, profile.fullName]);
  }

  return rows;
}

/**
 * Export a Single Week Schedule to Microsoft Excel (.xlsx) using the specified template
 */
export function exportScheduleToExcel(
  entries: ScheduleEntry[],
  weekInfo: WeekInfo,
  profile: TeacherProfile,
  template: ScheduleTemplateConfig = DEFAULT_TEMPLATE
): void {
  const wb = XLSX.utils.book_new();
  const rows = buildWeekSheetRows(entries, weekInfo, profile, template, true);
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  const visibleCols = template.columns.filter((c) => c.visible);
  ws["!cols"] = visibleCols.map((c) => ({ wch: c.width || 18 }));

  const sheetName = `Tuần ${weekInfo.weekNumber}`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanTeacher = profile.fullName.replace(/\s+/g, "_");
  const fileName = `Lich_Bao_Giang_Tuan_${weekInfo.weekNumber}_${cleanTeacher}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export interface CombinedExportOptions {
  startWeek: number;
  endWeek: number;
  mode: "multi_sheets" | "single_sheet_continuous";
  timetable: TimetableSlot[];
  curriculums: SubjectCurriculum[];
  startDateSemester1: string;
  holidays: HolidayEntry[];
  customOverrides: Record<string, Partial<ScheduleEntry>>;
  profile: TeacherProfile;
  template: ScheduleTemplateConfig;
}

/**
 * Export "LỊCH BÁO GIẢNG CHUNG" (General Multi-Week Schedule) to Microsoft Excel (.xlsx)
 * Supports all weeks in Semester 1 (e.g. Weeks 1 to 18), Semester 2 (Weeks 19 to 35), or Full Year.
 */
export function exportCombinedScheduleToExcel(options: CombinedExportOptions): void {
  const {
    startWeek,
    endWeek,
    mode,
    timetable,
    curriculums,
    startDateSemester1,
    holidays,
    customOverrides,
    profile,
    template = DEFAULT_TEMPLATE,
  } = options;

  const wb = XLSX.utils.book_new();
  const visibleCols = template.columns.filter((c) => c.visible);
  const colWidths = visibleCols.map((c) => ({ wch: c.width || 18 }));

  if (mode === "multi_sheets") {
    // Mode 1: Each week gets its own dedicated worksheet
    for (let w = startWeek; w <= endWeek; w++) {
      const weekInfo = calculateWeekDates(startDateSemester1, w);
      const weekEntries = generateWeeklySchedule({
        timetable,
        curriculums,
        startDateSemester1,
        targetWeek: w,
        holidays,
        customOverrides,
      });

      const rows = buildWeekSheetRows(weekEntries, weekInfo, profile, template, true);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = colWidths;

      const sheetTitle = `Tuần ${w}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    }
  } else {
    // Mode 2: Single continuous sheet with all weeks concatenated
    const continuousRows: (string | number | null)[][] = [];

    const school = template.schoolName || profile.schoolName || "TRƯỜNG TIỂU HỌC";
    const upper = template.upperDepartment || "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO";
    const dept = template.departmentName || profile.department || "TỔ CHUYÊN MÔN";
    const docTitle = template.documentTitle || "LỊCH BÁO GIẢNG CHUNG";

    // General School Header
    continuousRows.push([upper, null, null, null, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"]);
    continuousRows.push([school, null, null, null, "Độc lập - Tự do - Hạnh phúc"]);
    continuousRows.push([dept, null, null, null, ""]);
    continuousRows.push(["", null, null, null, ""]);

    continuousRows.push([`${docTitle} (TỪ TUẦN ${startWeek} ĐẾN TUẦN ${endWeek})`, null, null, null, ""]);
    continuousRows.push([`Năm học: ${profile.academicYear}  |  Giáo viên: ${profile.fullName}`, null, null, null, ""]);
    continuousRows.push(["", null, null, null, ""]);

    for (let w = startWeek; w <= endWeek; w++) {
      const weekInfo = calculateWeekDates(startDateSemester1, w);
      const weekEntries = generateWeeklySchedule({
        timetable,
        curriculums,
        startDateSemester1,
        targetWeek: w,
        holidays,
        customOverrides,
      });

      // Weekly Subheader
      continuousRows.push([
        `=== TUẦN ${w} (${weekInfo.rangeText}) - Tổng số: ${weekEntries.filter((e) => !e.isHoliday).length} tiết ===`,
        null,
        null,
        null,
        "",
      ]);

      // Column Header for this week
      continuousRows.push(visibleCols.map((c) => c.label));

      // Entries
      weekEntries.forEach((entry) => {
        const rowVals = visibleCols.map((col) => getEntryCellValue(entry, col.key));
        continuousRows.push(rowVals);
      });

      continuousRows.push(["", null, null, null, ""]);
    }

    // Final signature
    if (template.showSignatureBlock) {
      const today = new Date();
      const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

      continuousRows.push(["", null, null, null, ""]);
      continuousRows.push(["", null, null, null, dateStr]);
      continuousRows.push([template.signerLeftRole, null, null, null, template.signerRightRole]);
      continuousRows.push([template.signerLeftNote, null, null, null, template.signerRightNote]);
      continuousRows.push(["", null, null, null, ""]);
      continuousRows.push(["", null, null, null, profile.fullName]);
    }

    const ws = XLSX.utils.aoa_to_sheet(continuousRows);
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, `LBG_Tuan_${startWeek}_den_${endWeek}`);
  }

  const cleanName = profile.fullName.replace(/\s+/g, "_");
  const fileName = `Lich_Bao_Giang_Chung_Tuan_${startWeek}_den_${endWeek}_${cleanName}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export schedule to CSV with UTF-8 BOM for Microsoft Excel compatibility (legacy fallback)
 */
export function exportToCSV(
  entries: ScheduleEntry[],
  weekInfo: WeekInfo,
  profile: TeacherProfile
): void {
  const headers = [
    "Thứ / Ngày",
    "Buổi",
    "Tiết TKB",
    "Lớp",
    "Môn học",
    "Tiết PPCT",
    "Tên bài dạy / Nội dung công việc",
    "ĐDDH / Thiết bị dạy học",
    "Ghi chú",
  ];

  const rows = entries.map((e) => {
    const dayLabel = `Thứ ${e.dayOfWeek} (${e.dateStr})`;
    const sessionLabel = e.session === "morning" ? "Sáng" : "Chiều";
    const ppct = e.ppctPeriod ? e.ppctPeriod.toString() : "";
    return [
      `"${dayLabel}"`,
      `"${sessionLabel}"`,
      `"${e.period}"`,
      `"${e.className}"`,
      `"${e.subject}"`,
      `"${ppct}"`,
      `"${(e.lessonTitle || "").replace(/"/g, '""')}"`,
      `"${(e.equipment || "").replace(/"/g, '""')}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const metadataRows = [
    `"LỊCH BÁO GIẢNG - TUẦN ${weekInfo.weekNumber}"`,
    `"${profile.schoolName} - ${profile.department}"`,
    `"Giáo viên: ${profile.fullName} | Năm học: ${profile.academicYear} | ${weekInfo.rangeText}"`,
    "",
    headers.join(","),
    ...rows,
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + metadataRows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Lich_Bao_Giang_Tuan_${weekInfo.weekNumber}_${profile.fullName.replace(/\s+/g, "_")}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy HTML formatted table to clipboard so the user can paste directly into Microsoft Word
 */
export async function copyTableToWord(elementId: string): Promise<boolean> {
  const tableEl = document.getElementById(elementId);
  if (!tableEl) return false;

  try {
    const htmlContent = tableEl.outerHTML;
    const blobHtml = new Blob([htmlContent], { type: "text/html" });
    const blobText = new Blob([tableEl.innerText], { type: "text/plain" });

    const clipboardItem = new ClipboardItem({
      "text/html": blobHtml,
      "text/plain": blobText,
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.error("Clipboard write error:", err);
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(tableEl);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
      selection?.removeAllRanges();
      return true;
    } catch {
      return false;
    }
  }
}
