import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { ScheduleColumnKey, ScheduleTemplateColumn, ScheduleTemplateConfig } from "../types";

export const DEFAULT_COLUMNS: ScheduleTemplateColumn[] = [
  { key: "dayOfWeek", label: "Thứ, ngày", width: 16, align: "center", visible: true },
  { key: "session", label: "Buổi", width: 10, align: "center", visible: true },
  { key: "period", label: "Tiết TKB", width: 10, align: "center", visible: true },
  { key: "className", label: "Lớp", width: 12, align: "center", visible: true },
  { key: "subject", label: "Môn học", width: 18, align: "center", visible: true },
  { key: "ppctPeriod", label: "Tiết PPCT", width: 12, align: "center", visible: true },
  { key: "lessonTitle", label: "Tên bài dạy (Đầu bài)", width: 42, align: "left", visible: true },
  { key: "equipment", label: "ĐDDH / Thiết bị dạy học", width: 26, align: "left", visible: true },
  { key: "notes", label: "Ghi chú", width: 20, align: "left", visible: true },
];

export const DEFAULT_TEMPLATE: ScheduleTemplateConfig = {
  id: "template-gdpt2018-standard",
  name: "Mẫu chuẩn GDPT 2018 (Tiểu học & THCS)",
  sourceType: "builtin_standard",
  documentTitle: "LỊCH BÁO GIẢNG",
  upperDepartment: "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO",
  schoolName: "TRƯỜNG TIỂU HỌC",
  departmentName: "TỔ CHUYÊN MÔN",
  columns: DEFAULT_COLUMNS,
  signerLeftRole: "DUYỆT CỦA TỔ CHUYÊN MÔN / BAN GIÁM HIỆU",
  signerLeftNote: "(Ký và ghi rõ họ tên)",
  signerRightRole: "GIÁO VIÊN BỘ MÔN",
  signerRightNote: "(Ký và ghi rõ họ tên)",
  showSignatureBlock: true,
};

export const SECONDARY_TEMPLATE: ScheduleTemplateConfig = {
  id: "template-thcs-standard",
  name: "Mẫu chuẩn THCS / THPT (8 cột - Bộ GD&ĐT)",
  sourceType: "builtin_secondary",
  documentTitle: "KẾ HOẠCH BÀI DẠY - LỊCH BÁO GIẢNG",
  upperDepartment: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
  schoolName: "TRƯỜNG TRUNG HỌC CƠ SỞ",
  departmentName: "TỔ KHOA HỌC TỰ NHIÊN / TIN HỌC",
  columns: [
    { key: "dayOfWeek", label: "Thứ / Ngày", width: 16, align: "center", visible: true },
    { key: "period", label: "Tiết", width: 8, align: "center", visible: true },
    { key: "className", label: "Lớp", width: 10, align: "center", visible: true },
    { key: "subject", label: "Môn", width: 16, align: "center", visible: true },
    { key: "ppctPeriod", label: "Tiết PPCT", width: 12, align: "center", visible: true },
    { key: "lessonTitle", label: "Tên bài học", width: 44, align: "left", visible: true },
    { key: "equipment", label: "Thiết bị dạy học", width: 24, align: "left", visible: true },
    { key: "notes", label: "Ghi chú", width: 18, align: "left", visible: true },
  ],
  signerLeftRole: "BAN GIÁM HIỆU DUYỆT",
  signerLeftNote: "(Ký, đóng dấu)",
  signerRightRole: "GIÁO VIÊN GIẢNG DẠY",
  signerRightNote: "(Ký và ghi rõ họ tên)",
  showSignatureBlock: true,
};

export const SECONDARY_COMPACT_TEMPLATE: ScheduleTemplateConfig = {
  id: "template-thcs-compact",
  name: "Mẫu THCS Rút gọn (7 cột)",
  sourceType: "builtin_secondary",
  documentTitle: "LỊCH BÁO GIẢNG",
  upperDepartment: "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO",
  schoolName: "TRƯỜNG TRUNG HỌC CƠ SỞ",
  departmentName: "TỔ CHUYÊN MÔN",
  columns: [
    { key: "dayOfWeek", label: "Thứ, ngày", width: 16, align: "center", visible: true },
    { key: "period", label: "Tiết TKB", width: 10, align: "center", visible: true },
    { key: "className", label: "Lớp", width: 10, align: "center", visible: true },
    { key: "subject", label: "Môn học", width: 16, align: "center", visible: true },
    { key: "ppctPeriod", label: "Tiết PPCT", width: 12, align: "center", visible: true },
    { key: "lessonTitle", label: "Tên bài dạy", width: 46, align: "left", visible: true },
    { key: "notes", label: "Ghi chú", width: 18, align: "left", visible: true },
  ],
  signerLeftRole: "TỔ TRƯỞNG DUYỆT",
  signerLeftNote: "(Ký và ghi rõ họ tên)",
  signerRightRole: "GIÁO VIÊN",
  signerRightNote: "(Ký và ghi rõ họ tên)",
  showSignatureBlock: true,
};

export const SPECIALIST_TEMPLATE: ScheduleTemplateConfig = {
  id: "template-specialist-teacher",
  name: "Mẫu Giáo viên Bộ môn / Chuyên trách (7 cột)",
  sourceType: "builtin_standard",
  documentTitle: "LỊCH BÁO GIẢNG BỘ MÔN",
  upperDepartment: "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO",
  schoolName: "TRƯỜNG TIỂU HỌC",
  departmentName: "TỔ CHUYÊN MÔN ĐẶC THÙ",
  columns: [
    { key: "dayOfWeek", label: "Thứ / Ngày", width: 16, align: "center", visible: true },
    { key: "session", label: "Buổi", width: 10, align: "center", visible: true },
    { key: "period", label: "Tiết", width: 8, align: "center", visible: true },
    { key: "className", label: "Lớp", width: 10, align: "center", visible: true },
    { key: "ppctPeriod", label: "Tiết PPCT", width: 12, align: "center", visible: true },
    { key: "lessonTitle", label: "Tên bài dạy", width: 44, align: "left", visible: true },
    { key: "equipment", label: "ĐDDH / Thiết bị", width: 22, align: "left", visible: true },
  ],
  signerLeftRole: "TỔ TRƯỞNG CHUYÊN MÔN",
  signerLeftNote: "(Ký và ghi rõ họ tên)",
  signerRightRole: "GIÁO VIÊN BỘ MÔN",
  signerRightNote: "(Ký và ghi rõ họ tên)",
  showSignatureBlock: true,
};

// Match table column header text to recognized field key
export function matchColumnKey(headerText: string): ScheduleColumnKey | null {
  const norm = headerText.toLowerCase().replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  if (norm.includes("thứ") || norm.includes("ngày") || norm === "thứ, ngày" || norm.includes("ngày/thứ") || norm.includes("thứ/ngày")) return "dayOfWeek";
  if (norm.includes("buổi") || norm.includes("sáng/chiều") || norm.includes("buổi dạy")) return "session";
  if (norm.includes("tiết tkb") || norm === "tiết" || norm === "tiết dạy" || norm === "tiết thứ" || norm.includes("tiết theo tkb")) {
    if (norm.includes("ppct") || norm.includes("ct") || norm.includes("chương trình")) return "ppctPeriod";
    return "period";
  }
  if (norm.includes("lớp") || norm.includes("lớp dạy")) return "className";
  if (norm.includes("môn") || norm.includes("phân môn") || norm.includes("môn học") || norm.includes("môn dạy")) return "subject";
  if (norm.includes("ppct") || norm.includes("tiết ppct") || norm.includes("tiết ct") || norm.includes("chương trình") || norm.includes("phân phối")) return "ppctPeriod";
  if (norm.includes("tên bài") || norm.includes("đầu bài") || norm.includes("bài dạy") || norm.includes("nội dung") || norm.includes("bài học") || norm.includes("tên bài học")) return "lessonTitle";
  if (norm.includes("đddh") || norm.includes("thiết bị") || norm.includes("đồ dùng") || norm.includes("học liệu") || norm.includes("phương tiện")) return "equipment";
  if (norm.includes("ghi chú") || norm.includes("điều chỉnh") || norm.includes("nhận xét") || norm.includes("chú thích") || norm.includes("bổ sung")) return "notes";
  return null;
}

/**
 * Parse an uploaded schedule template file (.xlsx, .xls, .docx, .csv)
 */
export async function parseUploadedTemplateFile(file: File): Promise<ScheduleTemplateConfig> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const fileSize = file.size;

  let docTitle = "LỊCH BÁO GIẢNG";
  let upperDept = "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO";
  let school = "TRƯỜNG TIỂU HỌC";
  let dept = "TỔ CHUYÊN MÔN";
  let signerLeft = "DUYỆT CỦA TỔ CHUYÊN MÔN / BAN GIÁM HIỆU";
  let signerRight = "GIÁO VIÊN BỘ MÔN";
  let detectedColumns: ScheduleTemplateColumn[] = [];
  let base64Data: string | undefined;

  // Convert file to base64
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(binary);
  } catch (err) {
    console.error("Could not convert to base64", err);
  }

  // 1. Excel File Processing
  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv")) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let headerRowIndex = -1;

      // Scan rows 0 to 15 to find the table column header
      for (let r = 0; r < Math.min(rawRows.length, 16); r++) {
        const row = rawRows[r] || [];
        const rowText = row.map((cell) => String(cell || "").toLowerCase().trim()).join(" ");

        // Look for typical titles in top rows
        if (r < 6) {
          row.forEach((cell) => {
            const str = String(cell || "").trim();
            const upper = str.toUpperCase();
            if (upper.includes("LỊCH BÁO GIẢNG") || upper.includes("KẾ HOẠCH BÀI DẠY") || upper.includes("LỊCH GIẢNG DẠY")) {
              docTitle = str;
            } else if (upper.includes("TRƯỜNG")) {
              school = str;
            } else if (upper.includes("PHÒNG GD") || upper.includes("SỞ GD")) {
              upperDept = str;
            } else if (upper.includes("TỔ")) {
              dept = str;
            }
          });
        }

        // Check if this row is the column header row
        const hasDay = rowText.includes("thứ") || rowText.includes("ngày");
        const hasPeriod = rowText.includes("tiết");
        const hasLesson = rowText.includes("bài") || rowText.includes("nội dung");

        if ((hasDay && hasPeriod) || (hasPeriod && hasLesson)) {
          headerRowIndex = r;
          break;
        }
      }

      if (headerRowIndex !== -1) {
        const headerRow = rawRows[headerRowIndex] || [];
        const mappedColumns: ScheduleTemplateColumn[] = [];
        const usedKeys = new Set<string>();

        headerRow.forEach((cellVal) => {
          const text = String(cellVal || "").trim();
          if (!text) return;

          const key = matchColumnKey(text);
          if (key && !usedKeys.has(key)) {
            usedKeys.add(key);
            const defCol = DEFAULT_COLUMNS.find((c) => c.key === key);
            mappedColumns.push({
              key,
              label: text,
              width: defCol?.width || 18,
              align: defCol?.align || "left",
              visible: true,
            });
          }
        });

        if (mappedColumns.length >= 4) {
          detectedColumns = mappedColumns;
        }
      }

      // Check bottom rows for signatures
      for (let r = rawRows.length - 1; r >= Math.max(0, rawRows.length - 8); r--) {
        const row = rawRows[r] || [];
        row.forEach((cell) => {
          const upper = String(cell || "").toUpperCase();
          if (upper.includes("BAN GIÁM HIỆU") || upper.includes("HIỆU TRƯỞNG") || upper.includes("TỔ TRƯỞNG")) {
            signerLeft = String(cell || "").trim();
          } else if (upper.includes("GIÁO VIÊN")) {
            signerRight = String(cell || "").trim();
          }
        });
      }
    } catch (e) {
      console.error("Error reading Excel template:", e);
    }
  } else if (lowerName.endsWith(".docx")) {
    // 2. Word File Processing (.docx)
    try {
      const buffer = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer: buffer });
      const text = res.value || "";
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      // Extract school and document title from top lines
      for (let i = 0; i < Math.min(lines.length, 12); i++) {
        const line = lines[i];
        const upper = line.toUpperCase();
        if (upper.includes("LỊCH BÁO GIẢNG") || upper.includes("KẾ HOẠCH BÀI DẠY") || upper.includes("LỊCH GIẢNG DẠY")) {
          docTitle = line;
        } else if (upper.includes("TRƯỜNG")) {
          school = line;
        } else if (upper.includes("PHÒNG") || upper.includes("SỞ")) {
          upperDept = line;
        } else if (upper.includes("TỔ")) {
          dept = line;
        }
      }

      // Check bottom lines for signature roles
      for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
        const upper = lines[i].toUpperCase();
        if (upper.includes("BAN GIÁM HIỆU") || upper.includes("HIỆU TRƯỞNG") || upper.includes("TỔ TRƯỞNG")) {
          signerLeft = lines[i];
        } else if (upper.includes("GIÁO VIÊN")) {
          signerRight = lines[i];
        }
      }

      // Extract HTML from docx to detect table column headers
      try {
        const htmlRes = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const html = htmlRes.value || "";
        const parser = new DOMParser();
        const docHtml = parser.parseFromString(html, "text/html");
        const tables = docHtml.querySelectorAll("table");

        if (tables.length > 0) {
          for (let t = 0; t < tables.length; t++) {
            const table = tables[t];
            const rows = table.querySelectorAll("tr");
            for (let r = 0; r < Math.min(rows.length, 6); r++) {
              const cells = rows[r].querySelectorAll("th, td");
              const cellTexts = Array.from(cells).map((c) => c.textContent?.trim() || "");
              const rowText = cellTexts.join(" ").toLowerCase();

              if (
                (rowText.includes("thứ") || rowText.includes("ngày")) &&
                (rowText.includes("tiết") || rowText.includes("bài") || rowText.includes("lớp"))
              ) {
                const mappedCols: ScheduleTemplateColumn[] = [];
                const usedKeys = new Set<string>();

                cellTexts.forEach((cellText) => {
                  if (!cellText) return;
                  const key = matchColumnKey(cellText);
                  if (key && !usedKeys.has(key)) {
                    usedKeys.add(key);
                    const defCol = DEFAULT_COLUMNS.find((c) => c.key === key);
                    mappedCols.push({
                      key,
                      label: cellText,
                      width: defCol?.width || 18,
                      align: defCol?.align || "left",
                      visible: true,
                    });
                  }
                });

                if (mappedCols.length >= 4) {
                  detectedColumns = mappedCols;
                  break;
                }
              }
            }
            if (detectedColumns.length >= 4) break;
          }
        }
      } catch (errHtml) {
        console.warn("Could not parse table columns from docx HTML:", errHtml);
      }
    } catch (e) {
      console.error("Error reading Word template:", e);
    }
  }

  // Ensure mandatory columns exist
  if (detectedColumns.length === 0) {
    detectedColumns = [...DEFAULT_COLUMNS];
  } else {
    // Add any missing essential columns
    const essentialKeys: ScheduleColumnKey[] = ["dayOfWeek", "period", "className", "subject", "lessonTitle"];
    essentialKeys.forEach((k) => {
      if (!detectedColumns.some((c) => c.key === k)) {
        const def = DEFAULT_COLUMNS.find((c) => c.key === k);
        if (def) detectedColumns.push({ ...def });
      }
    });
  }

  const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

  return {
    id: `custom-template-${Date.now()}`,
    name: `Mẫu trường: ${cleanName}`,
    fileName,
    fileSize,
    uploadedAt: new Date().toLocaleDateString("vi-VN"),
    sourceType: lowerName.endsWith(".docx") ? "uploaded_word" : "uploaded_excel",
    documentTitle: docTitle || "LỊCH BÁO GIẢNG",
    upperDepartment: upperDept,
    schoolName: school,
    departmentName: dept,
    columns: detectedColumns,
    signerLeftRole: signerLeft,
    signerLeftNote: "(Ký và ghi rõ họ tên)",
    signerRightRole: signerRight,
    signerRightNote: "(Ký và ghi rõ họ tên)",
    showSignatureBlock: true,
    rawFileBase64: base64Data,
  };
}

/**
 * Generate a downloadable Blank Excel Template (.xlsx)
 * that matches the specified configuration
 */
export function generateBlankTemplateExcel(template: ScheduleTemplateConfig): void {
  const wb = XLSX.utils.book_new();

  const titleRows: (string | null)[][] = [
    [template.upperDepartment || "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO", null, null, null, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"],
    [template.schoolName || "TRƯỜNG TIỂU HỌC", null, null, null, "Độc lập - Tự do - Hạnh phúc"],
    [template.departmentName || "TỔ CHUYÊN MÔN", null, null, null, ""],
    ["", null, null, null, ""],
    [template.documentTitle || "LỊCH BÁO GIẢNG", null, null, null, ""],
    ["Tuần: ..... Từ ngày ..... đến ngày .....", null, null, null, ""],
    ["Giáo viên: ................................ Môn: ........................ Năm học: 2025 - 2026", null, null, null, ""],
    ["", null, null, null, ""],
  ];

  const headerRow = template.columns.filter((c) => c.visible).map((c) => c.label);
  const sampleRow1 = template.columns.filter((c) => c.visible).map((c) => {
    switch (c.key) {
      case "dayOfWeek": return "Thứ Hai (08/09)";
      case "session": return "Sáng";
      case "period": return 1;
      case "className": return "Ba 1";
      case "subject": return "Tin học";
      case "ppctPeriod": return 1;
      case "lessonTitle": return "Bài 1: Thông tin và quyết định (Tiết 1)";
      case "equipment": return "Máy tính, máy chiếu";
      case "notes": return "Chuẩn";
      default: return "";
    }
  });

  const sampleRow2 = template.columns.filter((c) => c.visible).map((c) => {
    switch (c.key) {
      case "dayOfWeek": return "Thứ Hai (08/09)";
      case "session": return "Sáng";
      case "period": return 2;
      case "className": return "Ba 2";
      case "subject": return "Tin học";
      case "ppctPeriod": return 1;
      case "lessonTitle": return "Bài 1: Thông tin và quyết định (Tiết 1)";
      case "equipment": return "Máy tính, máy chiếu";
      case "notes": return "Chuẩn";
      default: return "";
    }
  });

  const footerRows: (string | null)[][] = [
    ["", null, null, null, ""],
    [template.signerLeftRole, null, null, null, template.signerRightRole],
    [template.signerLeftNote, null, null, null, template.signerRightNote],
    ["", null, null, null, ""],
    ["", null, null, null, ""],
  ];

  const fullData = [...titleRows, headerRow, sampleRow1, sampleRow2, ...footerRows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  // Set column widths
  ws["!cols"] = template.columns.filter((c) => c.visible).map((c) => ({ wch: c.width || 18 }));

  XLSX.utils.book_append_sheet(wb, ws, "Mau_Lich_Bao_Giang");
  XLSX.writeFile(wb, `File_Mau_Lich_Bao_Giang_${template.name.replace(/\s+/g, "_")}.xlsx`);
}
