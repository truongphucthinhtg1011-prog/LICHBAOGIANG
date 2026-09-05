import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { LessonPlanItem } from "../types";

export interface FileParseResult {
  fileType: "excel" | "word" | "pdf" | "image" | "text" | "unknown";
  fileName: string;
  fileSize: number;
  extractedText: string;
  structuredLessons?: LessonPlanItem[];
  base64Data?: string;
  mimeType?: string;
  detectedSubject?: string;
  detectedGrade?: string;
  detectedClasses?: string;
}

export async function parseUploadedPpctFile(file: File): Promise<FileParseResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const lowerName = fileName.toLowerCase();

  // Detect grade or subject from file name
  let detectedSubject: string | undefined;
  let detectedGrade: string | undefined;
  let detectedClasses: string | undefined;

  if (lowerName.includes("công nghệ") || lowerName.includes("cong nghe") || /\bcn\s*[1-5]?\b/i.test(lowerName)) {
    detectedSubject = "Công nghệ";
  } else if (lowerName.includes("tin học") || lowerName.includes("tin hoc") || /\b(tin|th)\s*[1-5]?\b/i.test(lowerName)) {
    detectedSubject = "Tin học";
  } else if (lowerName.includes("toán") || lowerName.includes("toan")) {
    detectedSubject = "Toán";
  } else if (lowerName.includes("văn") || lowerName.includes("tiếng việt") || lowerName.includes("tieng viet") || /\btv\s*[1-5]?\b/i.test(lowerName)) {
    detectedSubject = "Tiếng Việt";
  } else if (lowerName.includes("đạo đức") || lowerName.includes("dao duc")) {
    detectedSubject = "Đạo đức";
  } else if (lowerName.includes("tiếng anh") || lowerName.includes("english")) {
    detectedSubject = "Tiếng Anh";
  } else if (lowerName.includes("khoa học") || lowerName.includes("khoa hoc")) {
    detectedSubject = "Khoa học";
  } else if (lowerName.includes("lịch sử") || lowerName.includes("địa lí") || lowerName.includes("ls&đl")) {
    detectedSubject = "Lịch sử và Địa lí";
  } else if (lowerName.includes("trải nghiệm") || lowerName.includes("hđtn")) {
    detectedSubject = "Hoạt động trải nghiệm";
  } else if (lowerName.includes("mĩ thuật") || lowerName.includes("mỹ thuật")) {
    detectedSubject = "Mĩ thuật";
  } else if (lowerName.includes("âm nhạc")) {
    detectedSubject = "Âm nhạc";
  }

  const gradeMatch = lowerName.match(/(?:khối|lớp|lop|khoi|k|g)[\s_.-]*([1-5]|[6-9]|1[0-2])\b/i) 
    || lowerName.match(/(?:tin|th|cn|toan|tv)[\s_.-]*([1-5])\b/i)
    || lowerName.match(/\b([1-5])\b/);
  if (gradeMatch && gradeMatch[1]) {
    detectedGrade = gradeMatch[1];
  }

  // 1. Excel files (.xlsx, .xls, .csv)
  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv")) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert sheet to json matrix
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
    
    // Convert to readable text
    const textLines = rows
      .map((row) => row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "").join(" | "))
      .filter((line) => line.length > 0);
    const extractedText = textLines.join("\n");

    // Try detecting structured columns in Excel table
    const structuredLessons = tryExtractLessonsFromExcelRows(rows);

    return {
      fileType: "excel",
      fileName,
      fileSize,
      extractedText,
      structuredLessons: structuredLessons.length > 0 ? structuredLessons : undefined,
      detectedSubject,
      detectedGrade,
      detectedClasses,
    };
  }

  // 2. Word documents (.docx)
  if (lowerName.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const extractedText = result.value || "";
    const structuredLessons = tryExtractLessonsFromText(extractedText);

    return {
      fileType: "word",
      fileName,
      fileSize,
      extractedText,
      structuredLessons: structuredLessons.length > 0 ? structuredLessons : undefined,
      detectedSubject,
      detectedGrade,
      detectedClasses,
    };
  }

  // 3. Plain Text / Markdown (.txt, .md, .tsv)
  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md") || lowerName.endsWith(".tsv")) {
    const extractedText = await file.text();
    const structuredLessons = tryExtractLessonsFromText(extractedText);
    return {
      fileType: "text",
      fileName,
      fileSize,
      extractedText,
      structuredLessons: structuredLessons.length > 0 ? structuredLessons : undefined,
      detectedSubject,
      detectedGrade,
      detectedClasses,
    };
  }

  // 4. PDF (.pdf)
  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    const base64Data = await fileToBase64(file);
    return {
      fileType: "pdf",
      fileName,
      fileSize,
      extractedText: `[Tệp PDF: ${fileName} - Dung lượng: ${(fileSize / 1024).toFixed(1)} KB]`,
      base64Data,
      mimeType: "application/pdf",
      detectedSubject,
      detectedGrade,
      detectedClasses,
    };
  }

  // 5. Image files (.png, .jpg, .jpeg, .webp)
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp)$/i.test(lowerName)) {
    const base64Data = await fileToBase64(file);
    return {
      fileType: "image",
      fileName,
      fileSize,
      extractedText: `[Ảnh chụp PPCT: ${fileName} - Dung lượng: ${(fileSize / 1024).toFixed(1)} KB]`,
      base64Data,
      mimeType: file.type || "image/jpeg",
      detectedSubject,
      detectedGrade,
      detectedClasses,
    };
  }

  // Default fallback (try text)
  try {
    const extractedText = await file.text();
    return {
      fileType: "text",
      fileName,
      fileSize,
      extractedText,
      detectedSubject,
      detectedGrade,
      detectedClasses,
    };
  } catch {
    const base64Data = await fileToBase64(file);
    return {
      fileType: "unknown",
      fileName,
      fileSize,
      extractedText: `[Tệp: ${fileName}]`,
      base64Data,
      mimeType: file.type || "application/octet-stream",
      detectedSubject,
      detectedGrade,
      detectedClasses,
    };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // strip data URL prefix (e.g. data:image/png;base64,xxxx)
      const commaIdx = result.indexOf(",");
      if (commaIdx !== -1) {
        resolve(result.substring(commaIdx + 1));
      } else {
        resolve(result);
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

function tryExtractLessonsFromExcelRows(rows: any[][]): LessonPlanItem[] {
  if (!rows || rows.length < 2) return [];

  // Find header row
  let headerRowIndex = -1;
  let colPeriod = -1;
  let colTitle = -1;
  let colTopic = -1;
  let colEquipment = -1;
  let colNotes = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r].map((cell) => String(cell || "").toLowerCase().trim());
    const periodIdx = row.findIndex((c) => c.includes("tiết") || c === "stt" || c === "tt");
    const titleIdx = row.findIndex((c) => c.includes("tên bài") || c.includes("nội dung") || c.includes("bài học") || c.includes("tên bài dạy"));

    if (titleIdx !== -1) {
      headerRowIndex = r;
      colPeriod = periodIdx;
      colTitle = titleIdx;
      colTopic = row.findIndex((c) => c.includes("chủ đề") || c.includes("chương") || c.includes("mạch nội dung"));
      colEquipment = row.findIndex((c) => c.includes("đddh") || c.includes("thiết bị") || c.includes("đồ dùng") || c.includes("phương tiện"));
      colNotes = row.findIndex((c) => c.includes("ghi chú") || c.includes("lưu ý"));
      break;
    }
  }

  if (headerRowIndex === -1 || colTitle === -1) {
    return [];
  }

  const lessons: LessonPlanItem[] = [];
  let currentPeriod = 1;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const titleRaw = String(row[colTitle] || "").trim();
    if (!titleRaw) continue;

    // Skip section headers like "HỌC KỲ I", "CHỦ ĐỀ A" if they don't have a period number
    const periodRaw = colPeriod !== -1 ? row[colPeriod] : null;
    let periodNum = parseInt(String(periodRaw), 10);

    if (isNaN(periodNum)) {
      // Check if title has numbers
      const match = titleRaw.match(/^(?:tiết|bài)?\s*(\d+)[:.]/i);
      if (match) {
        periodNum = parseInt(match[1], 10);
      } else {
        periodNum = currentPeriod;
      }
    }

    currentPeriod = periodNum + 1;

    lessons.push({
      id: `xls-${Date.now()}-${r}`,
      periodNumber: periodNum,
      lessonTitle: titleRaw,
      unitOrTopic: colTopic !== -1 && row[colTopic] ? String(row[colTopic]).trim() : undefined,
      equipment: colEquipment !== -1 && row[colEquipment] ? String(row[colEquipment]).trim() : undefined,
      notes: colNotes !== -1 && row[colNotes] ? String(row[colNotes]).trim() : undefined,
    });
  }

  return lessons;
}

export function tryExtractLessonsFromText(text: string): LessonPlanItem[] {
  if (!text || text.trim().length === 0) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lessons: LessonPlanItem[] = [];
  let currentPeriod = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern A: "Tiết 1: Tên bài ... - ĐDDH: ...", "Tiết 1 - Tên bài...", "Tiết 1. Tên bài..."
    const periodMatch = line.match(/^(?:tiết|tiet|t|tuần\s*\d+\s*[-:]?\s*tiết)\s*(\d+)[\s.:\-–—]+/i);
    // Pattern B: "1. Bài 1...", "1/ Tên bài..."
    const numPrefixMatch = line.match(/^(\d+)[\.\)\/]\s+(.+)/);

    let periodNum: number | null = null;
    let content = "";

    if (periodMatch) {
      periodNum = parseInt(periodMatch[1], 10);
      content = line.substring(periodMatch[0].length).trim();
    } else if (numPrefixMatch && numPrefixMatch[2].length > 5 && !line.toLowerCase().startsWith("tuần") && !line.toLowerCase().startsWith("lớp")) {
      const parsedNum = parseInt(numPrefixMatch[1], 10);
      if (parsedNum === currentPeriod || parsedNum === lessons.length + 1) {
        periodNum = parsedNum;
        content = numPrefixMatch[2].trim();
      }
    }

    if (periodNum !== null && content.length > 0) {
      // Check if equipment is tagged: " - ĐDDH: Máy tính", " | Thiết bị: ...", " (ĐDDH: ...)"
      let equipment: string | undefined;
      let unitOrTopic: string | undefined;
      let lessonTitle = content;

      const equipMatch = lessonTitle.match(/[-–—|]\s*(?:đddh|thiết bị|tb|đồ dùng|phương tiện)\s*[:：]\s*([^–—\n|]+)/i)
        || lessonTitle.match(/\((?:đddh|thiết bị|tb|đồ dùng)\s*[:：]\s*([^\)]+)\)/i);

      if (equipMatch) {
        equipment = equipMatch[1].trim();
        lessonTitle = lessonTitle.replace(equipMatch[0], "").trim();
      }

      const topicMatch = lessonTitle.match(/^(?:chủ đề|chương|phần)\s*([a-zA-Z0-9IVX]+)[\s.:\-–—]+(.+)/i);
      if (topicMatch) {
        unitOrTopic = `Chủ đề ${topicMatch[1]}`;
        lessonTitle = topicMatch[2].trim();
      }

      // Cleanup trailing dashes or dots
      lessonTitle = lessonTitle.replace(/[-–—.:;,]+$/, "").trim();

      if (lessonTitle) {
        lessons.push({
          id: `txt-${Date.now()}-${lessons.length + 1}`,
          periodNumber: periodNum,
          lessonTitle,
          unitOrTopic,
          equipment,
          notes: "",
        });
        currentPeriod = periodNum + 1;
      }
    }
  }

  // Only return if we found a reasonable sequence of lessons (at least 2)
  return lessons.length >= 2 ? lessons : [];
}
