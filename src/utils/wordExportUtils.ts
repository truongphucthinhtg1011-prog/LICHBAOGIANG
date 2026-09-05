import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  PageOrientation,
  ShadingType,
  VerticalAlign,
  PageBreak,
} from "docx";
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

const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4, // 0.5 pt
  color: "222222",
};

const CELL_BORDERS = {
  top: TABLE_BORDER,
  bottom: TABLE_BORDER,
  left: TABLE_BORDER,
  right: TABLE_BORDER,
};

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: "auto",
};

const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

const CELL_MARGINS = {
  top: 80, // dxa (approx 4pt)
  bottom: 80,
  left: 100, // dxa (approx 5pt)
  right: 100,
};

/**
 * Format entry value based on column key
 */
function getEntryCellValue(entry: ScheduleEntry, key: string): string {
  switch (key) {
    case "dayOfWeek":
      return `Thứ ${entry.dayOfWeek} (${entry.dateStr})`;
    case "session":
      return entry.session === "morning" ? "Sáng" : "Chiều";
    case "period":
      return entry.period.toString();
    case "className":
      return entry.className;
    case "subject":
      return entry.subject;
    case "ppctPeriod":
      return entry.ppctPeriod !== null && entry.ppctPeriod !== undefined ? entry.ppctPeriod.toString() : "";
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
 * Build docx elements (Header table, Title paragraphs, Schedule table, Signature table) for a given week
 */
function buildWeekDocxElements(
  entries: ScheduleEntry[],
  weekInfo: WeekInfo,
  profile: TeacherProfile,
  template: ScheduleTemplateConfig = DEFAULT_TEMPLATE,
  customTitlePrefix?: string
): (Paragraph | Table)[] {
  const visibleCols = template.columns.filter((c) => c.visible);
  const elements: (Paragraph | Table)[] = [];

  const school = template.schoolName || profile.schoolName || "TRƯỜNG TIỂU HỌC";
  const upper = template.upperDepartment || "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO";
  const dept = template.departmentName || profile.department || "TỔ CHUYÊN MÔN";
  const title = customTitlePrefix || template.documentTitle || "LỊCH BÁO GIẢNG";

  const totalTeachingPeriods = entries.filter((e) => !e.isHoliday).length;

  // 1. National & School Header (2-column borderless table)
  // Total printable width on A4 landscape with 2cm margins is ~14200 dxa
  const headerTable = new Table({
    width: { size: 14200, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          // Left: School & Dept
          new TableCell({
            width: { size: 6800, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: upper.toUpperCase(),
                    font: "Times New Roman",
                    size: 21,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: school.toUpperCase(),
                    font: "Times New Roman",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: dept.toUpperCase(),
                    font: "Times New Roman",
                    bold: true,
                    size: 21,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "-----------------",
                    font: "Times New Roman",
                    size: 18,
                  }),
                ],
              }),
            ],
          }),

          // Right: National Motto
          new TableCell({
            width: { size: 7400, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
                    font: "Times New Roman",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Độc lập - Tự do - Hạnh phúc",
                    font: "Times New Roman",
                    bold: true,
                    size: 23,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "-----------------------",
                    font: "Times New Roman",
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  elements.push(headerTable);

  // 2. Title Block
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 60 },
      children: [
        new TextRun({
          text: `${title.toUpperCase()} - TUẦN ${weekInfo.weekNumber}`,
          font: "Times New Roman",
          bold: true,
          size: 28, // 14pt
          color: "111827",
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `(${weekInfo.rangeText}  |  Năm học: ${profile.academicYear})`,
          font: "Times New Roman",
          italics: true,
          size: 22, // 11pt
          color: "374151",
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `Giáo viên giảng dạy: `,
          font: "Times New Roman",
          size: 22,
        }),
        new TextRun({
          text: `${profile.fullName}`,
          font: "Times New Roman",
          bold: true,
          size: 22,
        }),
        new TextRun({
          text: `    |    Tổng số tiết: `,
          font: "Times New Roman",
          size: 22,
        }),
        new TextRun({
          text: `${totalTeachingPeriods} tiết/tuần`,
          font: "Times New Roman",
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  // 3. Main Schedule Table
  // Calculate dxa width for each visible column based on proportion
  const totalUnits = visibleCols.reduce((acc, col) => acc + (col.width || 15), 0);
  const colWidthsDxa = visibleCols.map((col) =>
    Math.round(((col.width || 15) / totalUnits) * 14200)
  );

  // Header Row
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: visibleCols.map((col, idx) => {
      return new TableCell({
        width: { size: colWidthsDxa[idx], type: WidthType.DXA },
        borders: CELL_BORDERS,
        margins: CELL_MARGINS,
        shading: { fill: "E8EEF5", type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: col.label,
                font: "Times New Roman",
                bold: true,
                size: 21, // 10.5pt
                color: "0F172A",
              }),
            ],
          }),
        ],
      });
    }),
  });

  // Data Rows
  const dataRows: TableRow[] = [];

  entries.forEach((entry) => {
    // If holiday row
    if (entry.isHoliday) {
      dataRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            // First cell shows Day/Date
            new TableCell({
              width: { size: colWidthsDxa[0], type: WidthType.DXA },
              borders: CELL_BORDERS,
              margins: CELL_MARGINS,
              shading: { fill: "FEE2E2", type: ShadingType.CLEAR },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `Thứ ${entry.dayOfWeek} (${entry.dateStr})`,
                      font: "Times New Roman",
                      bold: true,
                      size: 20,
                      color: "991B1B",
                    }),
                  ],
                }),
              ],
            }),
            // Spanned or filled holiday notice across remaining columns
            new TableCell({
              columnSpan: visibleCols.length - 1,
              borders: CELL_BORDERS,
              margins: CELL_MARGINS,
              shading: { fill: "FEE2E2", type: ShadingType.CLEAR },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `NGHỈ LỄ: ${(entry.holidayReason || "Nghỉ lễ theo quy định").toUpperCase()}`,
                      font: "Times New Roman",
                      bold: true,
                      italics: true,
                      size: 21,
                      color: "B91C1C",
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
      return;
    }

    // Normal teaching period row
    const cells = visibleCols.map((col, idx) => {
      const val = getEntryCellValue(entry, col.key);

      let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
      if (
        col.align === "center" ||
        col.key === "dayOfWeek" ||
        col.key === "session" ||
        col.key === "period" ||
        col.key === "className" ||
        col.key === "subject" ||
        col.key === "ppctPeriod"
      ) {
        alignment = AlignmentType.CENTER;
      }

      const isImportantCol =
        col.key === "period" || col.key === "className" || col.key === "ppctPeriod";

      return new TableCell({
        width: { size: colWidthsDxa[idx], type: WidthType.DXA },
        borders: CELL_BORDERS,
        margins: CELL_MARGINS,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment,
            children: [
              new TextRun({
                text: val,
                font: "Times New Roman",
                bold: isImportantCol,
                size: 21, // 10.5pt
                color: "1E293B",
              }),
            ],
          }),
        ],
      });
    });

    dataRows.push(
      new TableRow({
        cantSplit: true,
        children: cells,
      })
    );
  });

  const scheduleTable = new Table({
    width: { size: 14200, type: WidthType.DXA },
    borders: CELL_BORDERS,
    rows: [headerRow, ...dataRows],
  });

  elements.push(scheduleTable);

  // 4. Signature Block (2-column borderless table)
  if (template.showSignatureBlock) {
    const today = new Date();
    const dateLine = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    const signatureTable = new Table({
      width: { size: 14200, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            // Left: Administrator / Head of Department
            new TableCell({
              width: { size: 7100, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200 },
                  children: [
                    new TextRun({
                      text: (
                        template.signerLeftRole || "DUYỆT CỦA BGH / TỔ CHUYÊN MÔN"
                      ).toUpperCase(),
                      font: "Times New Roman",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: template.signerLeftNote || "(Ký và ghi rõ họ tên)",
                      font: "Times New Roman",
                      italics: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({ spacing: { before: 800 } }), // Space for physical signature
              ],
            }),

            // Right: Teacher
            new TableCell({
              width: { size: 7100, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200 },
                  children: [
                    new TextRun({
                      text: dateLine,
                      font: "Times New Roman",
                      italics: true,
                      size: 21,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: (
                        template.signerRightRole || "GIÁO VIÊN BỘ MÔN"
                      ).toUpperCase(),
                      font: "Times New Roman",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: template.signerRightNote || "(Ký và ghi rõ họ tên)",
                      font: "Times New Roman",
                      italics: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({ spacing: { before: 600 } }), // Space for signature
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: profile.fullName,
                      font: "Times New Roman",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    elements.push(signatureTable);
  }

  return elements;
}

/**
 * Export a Single Week Schedule to Microsoft Word (.docx) strictly following the school's template
 */
export async function exportScheduleToWord(
  entries: ScheduleEntry[],
  weekInfo: WeekInfo,
  profile: TeacherProfile,
  template: ScheduleTemplateConfig = DEFAULT_TEMPLATE
): Promise<void> {
  const elements = buildWeekDocxElements(entries, weekInfo, profile, template);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              // A4 Landscape: width 11.69 inch = 16838 dxa, height 8.27 inch = 11906 dxa
              width: 16838,
              height: 11906,
            },
            margin: {
              top: 1134, // 2 cm
              bottom: 1134, // 2 cm
              left: 1418, // 2.5 cm
              right: 1134, // 2 cm
            },
          },
        },
        children: elements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTeacher = profile.fullName.replace(/\s+/g, "_");
  const fileName = `Lich_Bao_Giang_Tuan_${weekInfo.weekNumber}_${cleanTeacher}.docx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface CombinedWordExportOptions {
  startWeek: number;
  endWeek: number;
  timetable: TimetableSlot[];
  curriculums: SubjectCurriculum[];
  startDateSemester1: string;
  holidays: HolidayEntry[];
  customOverrides: Record<string, Partial<ScheduleEntry>>;
  profile: TeacherProfile;
  template: ScheduleTemplateConfig;
}

/**
 * Export "LỊCH BÁO GIẢNG CHUNG" (Multi-Week / Full Semester / Full Year) to Microsoft Word (.docx)
 * Each week begins on a new page (via PageBreak) for professional booklet printing.
 */
export async function exportCombinedScheduleToWord(
  options: CombinedWordExportOptions
): Promise<void> {
  const {
    startWeek,
    endWeek,
    timetable,
    curriculums,
    startDateSemester1,
    holidays,
    customOverrides,
    profile,
    template = DEFAULT_TEMPLATE,
  } = options;

  const allElements: (Paragraph | Table)[] = [];

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

    const weekElements = buildWeekDocxElements(
      weekEntries,
      weekInfo,
      profile,
      template,
      "LỊCH BÁO GIẢNG"
    );

    // Append week elements
    allElements.push(...weekElements);

    // If not the last week, insert a PageBreak so the next week starts on a fresh page
    if (w < endWeek) {
      allElements.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838,
              height: 11906,
            },
            margin: {
              top: 1134,
              bottom: 1134,
              left: 1418,
              right: 1134,
            },
          },
        },
        children: allElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTeacher = profile.fullName.replace(/\s+/g, "_");
  const fileName = `Lich_Bao_Giang_Chung_Tuan_${startWeek}_den_${endWeek}_${cleanTeacher}.docx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
