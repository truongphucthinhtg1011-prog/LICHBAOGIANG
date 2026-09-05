import { TeacherProfile, TimetableSlot, SubjectCurriculum, HolidayEntry } from "../types";
import { fullCurriculums } from "./curriculumData";

export const initialTeacherProfile: TeacherProfile = {
  fullName: "Thầy Thoàn",
  schoolName: "Trường Tiểu Học",
  department: "Tổ Tin học - Công nghệ",
  academicYear: "2026 - 2027",
  semester: 1,
  startDateSemester1: "2026-09-07", // Thứ 2 ngày 07/09/2026 (Tuần 01)
  totalWeeks: 35,
  currentWeek: 1,
};

/**
 * Thời khóa biểu chính thức của Thầy Thoàn (Năm học 2026-2027)
 * Áp dụng từ ngày 07/9/2026 (Tuần 01)
 *
 * Tổng số tiết: 22 tiết/tuần
 * - Tin học khối 2, 3, 4, 5: 13 tiết
 * - Công nghệ khối 4, 5: 6 tiết
 * - Quản lý phòng máy (QLPM): 3 tiết
 */
export const initialTimetable: TimetableSlot[] = [
  // ==================== THỨ HAI (3 tiết Chiều) ====================
  // Tiết 5 (Chiều - 14:00 - 14:35): TH - Ba 1
  {
    id: "tkb-t2-t5",
    dayOfWeek: 2,
    session: "afternoon",
    period: 5,
    className: "Ba 1",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 6 (Chiều - 14:40 - 15:15): TH - Bốn 1
  {
    id: "tkb-t2-t6",
    dayOfWeek: 2,
    session: "afternoon",
    period: 6,
    className: "Bốn 1",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 7 (Chiều - 15:20 - 15:55): TH - Ba 2
  {
    id: "tkb-t2-t7",
    dayOfWeek: 2,
    session: "afternoon",
    period: 7,
    className: "Ba 2",
    subject: "Tin học",
    room: "Phòng máy",
  },

  // ==================== THỨ BA (7 tiết: 4 Sáng + 3 Chiều) ====================
  // Tiết 1 (Sáng - 7:00 - 7:35): TH - Năm 3
  {
    id: "tkb-t3-t1",
    dayOfWeek: 3,
    session: "morning",
    period: 1,
    className: "Năm 3",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 2 (Sáng - 7:40 - 8:15): CN - Bốn 2
  {
    id: "tkb-t3-t2",
    dayOfWeek: 3,
    session: "morning",
    period: 2,
    className: "Bốn 2",
    subject: "Công nghệ",
    room: "Lớp Bốn 2",
  },
  // Tiết 3 (Sáng - 8:20 - 8:55): QLPM
  {
    id: "tkb-t3-t3",
    dayOfWeek: 3,
    session: "morning",
    period: 3,
    className: "QLPM",
    subject: "Quản lý phòng máy",
    room: "Phòng máy",
  },
  // Tiết 4 (Sáng - 9:25 - 10:00): TH - Hai 3
  {
    id: "tkb-t3-t4",
    dayOfWeek: 3,
    session: "morning",
    period: 4,
    className: "Hai 3",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 5 (Chiều - 14:00 - 14:35): TH - Năm 2
  {
    id: "tkb-t3-t5",
    dayOfWeek: 3,
    session: "afternoon",
    period: 5,
    className: "Năm 2",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 6 (Chiều - 14:40 - 15:15): CN - Năm 2
  {
    id: "tkb-t3-t6",
    dayOfWeek: 3,
    session: "afternoon",
    period: 6,
    className: "Năm 2",
    subject: "Công nghệ",
    room: "Lớp Năm 2",
  },
  // Tiết 7 (Chiều - 15:20 - 15:55): TH - Hai 4
  {
    id: "tkb-t3-t7",
    dayOfWeek: 3,
    session: "afternoon",
    period: 7,
    className: "Hai 4",
    subject: "Tin học",
    room: "Phòng máy",
  },

  // ==================== THỨ TƯ (3 tiết: 2 Sáng + 1 Chiều) ====================
  // Tiết 3 (Sáng - 8:20 - 8:55): QLPM
  {
    id: "tkb-t4-t3",
    dayOfWeek: 4,
    session: "morning",
    period: 3,
    className: "QLPM",
    subject: "Quản lý phòng máy",
    room: "Phòng máy",
  },
  // Tiết 4 (Sáng - 9:25 - 10:00): QLPM
  {
    id: "tkb-t4-t4",
    dayOfWeek: 4,
    session: "morning",
    period: 4,
    className: "QLPM",
    subject: "Quản lý phòng máy",
    room: "Phòng máy",
  },
  // Tiết 5 (Chiều - 14:00 - 14:35): CN - Bốn 3
  {
    id: "tkb-t4-t5",
    dayOfWeek: 4,
    session: "afternoon",
    period: 5,
    className: "Bốn 3",
    subject: "Công nghệ",
    room: "Lớp Bốn 3",
  },

  // ==================== THỨ NĂM (5 tiết: 4 Sáng + 1 Chiều) ====================
  // Tiết 1 (Sáng - 7:00 - 7:35): TH - Hai 2
  {
    id: "tkb-t5-t1",
    dayOfWeek: 5,
    session: "morning",
    period: 1,
    className: "Hai 2",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 2 (Sáng - 7:40 - 8:15): TH - Hai 1
  {
    id: "tkb-t5-t2",
    dayOfWeek: 5,
    session: "morning",
    period: 2,
    className: "Hai 1",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 3 (Sáng - 8:20 - 8:55): TH - Bốn 3
  {
    id: "tkb-t5-t3",
    dayOfWeek: 5,
    session: "morning",
    period: 3,
    className: "Bốn 3",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 4 (Sáng - 9:25 - 10:00): CN - Bốn 1
  {
    id: "tkb-t5-t4",
    dayOfWeek: 5,
    session: "morning",
    period: 4,
    className: "Bốn 1",
    subject: "Công nghệ",
    room: "Lớp Bốn 1",
  },
  // Tiết 7 (Chiều - 15:20 - 15:55): TH - Ba 3
  {
    id: "tkb-t5-t7",
    dayOfWeek: 5,
    session: "afternoon",
    period: 7,
    className: "Ba 3",
    subject: "Tin học",
    room: "Phòng máy",
  },

  // ==================== THỨ SÁU (4 tiết: 3 Sáng + 1 Chiều) ====================
  // Tiết 1 (Sáng - 7:00 - 7:35): CN - Năm 1
  {
    id: "tkb-t6-t1",
    dayOfWeek: 6,
    session: "morning",
    period: 1,
    className: "Năm 1",
    subject: "Công nghệ",
    room: "Lớp Năm 1",
  },
  // Tiết 3 (Sáng - 8:20 - 8:55): CN - Năm 3
  {
    id: "tkb-t6-t3",
    dayOfWeek: 6,
    session: "morning",
    period: 3,
    className: "Năm 3",
    subject: "Công nghệ",
    room: "Lớp Năm 3",
  },
  // Tiết 4 (Sáng - 9:25 - 10:00): TH - Năm 1
  {
    id: "tkb-t6-t4",
    dayOfWeek: 6,
    session: "morning",
    period: 4,
    className: "Năm 1",
    subject: "Tin học",
    room: "Phòng máy",
  },
  // Tiết 5 (Chiều - 14:00 - 14:35): TH - Bốn 2
  {
    id: "tkb-t6-t5",
    dayOfWeek: 6,
    session: "afternoon",
    period: 5,
    className: "Bốn 2",
    subject: "Tin học",
    room: "Phòng máy",
  },
];

/**
 * Phân phối chương trình chi tiết 35 tuần cho các môn và khối lớp của Thầy Thoàn
 * Đầy đủ 35 tuần (Cả năm học GDPT 2018):
 * - Tin học Khối 2: Hai 1, Hai 2, Hai 3, Hai 4 (35 tiết)
 * - Tin học Khối 3: Ba 1, Ba 2, Ba 3 (35 tiết)
 * - Tin học Khối 4: Bốn 1, Bốn 2, Bốn 3 (35 tiết)
 * - Tin học Khối 5: Năm 1, Năm 2, Năm 3 (35 tiết)
 * - Công nghệ Khối 4: Bốn 1, Bốn 2, Bốn 3 (35 tiết)
 * - Công nghệ Khối 5: Năm 1, Năm 2, Năm 3 (35 tiết)
 * - Quản lý phòng máy (QLPM): 105 tiết (35 tuần x 3 tiết/tuần)
 */
export const initialCurriculums: SubjectCurriculum[] = fullCurriculums;

export const initialHolidays: HolidayEntry[] = [
  { id: "hol-1", date: "2026-09-02", name: "Nghỉ lễ Quốc khánh 2/9" },
  { id: "hol-2", date: "2026-11-20", name: "Kỷ niệm Ngày Nhà giáo Việt Nam 20/11" },
  { id: "hol-3", date: "2027-01-01", name: "Nghỉ Tết Dương lịch" },
];
