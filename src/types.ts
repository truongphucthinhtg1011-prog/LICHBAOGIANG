export type DayOfWeek = 2 | 3 | 4 | 5 | 6; // Thứ 2 đến Thứ 6
export type Session = "morning" | "afternoon"; // Sáng hoặc Chiều

export interface TimetableSlot {
  id: string;
  dayOfWeek: DayOfWeek;
  session: Session;
  period: number; // 1 -> 5
  className: string; // ví dụ: 9A1, 9A2, 8B
  subject: string; // Toán, Tin học, Ngữ văn...
  room?: string;
}

export interface LessonPlanItem {
  id: string;
  periodNumber: number; // Tiết PPCT (1, 2, 3...)
  lessonTitle: string; // Tên bài dạy
  unitOrTopic?: string; // Chủ đề / Chương
  equipment?: string; // Đồ dùng dạy học / Thiết bị
  notes?: string;
}

export interface SubjectCurriculum {
  id: string;
  subjectName: string;
  grade: string; // Khối 6, 7, 8, 9, 10, 11, 12
  assignedClasses: string[]; // Các lớp áp dụng (vd: ["9A1", "9A2"])
  lessons: LessonPlanItem[];
}

export interface ScheduleEntry {
  id: string;
  weekNumber: number;
  dayOfWeek: DayOfWeek;
  dateStr: string; // dd/mm/yyyy
  session: Session;
  period: number; // Tiết TKB
  className: string;
  subject: string;
  ppctPeriod: number | null; // Tiết thứ mấy theo PPCT
  lessonTitle: string;
  equipment: string;
  notes: string;
  isHoliday?: boolean;
  holidayReason?: string;
  isCustomModified?: boolean;
}

export interface TeacherProfile {
  fullName: string;
  schoolName: string;
  department: string; // Tổ chuyên môn
  academicYear: string; // 2025 - 2026
  semester: 1 | 2;
  startDateSemester1: string; // YYYY-MM-DD (ngày Thứ 2 tuần 1)
  totalWeeks: number; // 35 hoặc 37
  currentWeek: number;
}

export interface HolidayEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // Tên ngày nghỉ (vd: Nghỉ lễ 2/9, Nghỉ tết...)
  applyToAll?: boolean;
}

export type ScheduleColumnKey =
  | "dayOfWeek"
  | "session"
  | "period"
  | "className"
  | "subject"
  | "ppctPeriod"
  | "lessonTitle"
  | "equipment"
  | "notes";

export interface ScheduleTemplateColumn {
  key: ScheduleColumnKey;
  label: string; // Tên hiển thị của cột (vd: "Thứ, ngày", "Buổi", "Tiết TKB", "Lớp", "Tên bài dạy")
  width?: number; // Độ rộng ký tự trong Excel
  align?: "left" | "center" | "right";
  visible: boolean;
}

export interface ScheduleTemplateConfig {
  id: string;
  name: string; // Tên mẫu (vd: "Mẫu Trường Tiểu học Chu Văn An", "Mẫu chuẩn GDPT 2018")
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  sourceType: "uploaded_excel" | "uploaded_word" | "builtin_standard" | "builtin_secondary";
  
  // Header lines in export
  upperDepartment?: string; // Ví dụ: "PHÒNG GD&ĐT HUYỆN..."
  schoolName?: string; // Ví dụ: "TRƯỜNG TIỂU HỌC..."
  departmentName?: string; // Ví dụ: "TỔ CHUYÊN MÔN KHỐI 4 - 5"
  documentTitle: string; // Ví dụ: "LỊCH BÁO GIẢNG", "KẾ HOẠCH BÀI DẠY TUẦN"
  
  // Columns definition & order
  columns: ScheduleTemplateColumn[];
  
  // Footer & Signatures
  signerLeftRole: string; // "DUYỆT CỦA BAN GIÁM HIỆU / TỔ TRƯỞNG"
  signerLeftNote: string; // "(Ký và ghi rõ họ tên)"
  signerRightRole: string; // "GIÁO VIÊN BỘ MÔN"
  signerRightNote: string; // "(Ký và ghi rõ họ tên)"
  showSignatureBlock: boolean;

  // Raw base64 data of the uploaded Excel file to preserve template if needed
  rawFileBase64?: string;
}
