import React, { useState } from "react";
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Copy,
  Calendar,
  BookOpen,
  Settings,
  Sparkles,
  Check,
  UploadCloud,
  CalendarRange,
  RefreshCw,
} from "lucide-react";
import { ScheduleEntry, ScheduleTemplateConfig, TeacherProfile } from "../types";
import { WeekInfo } from "../utils/dateUtils";
import { copyTableToWord, exportScheduleToExcel } from "../utils/exportUtils";
import { exportScheduleToWord } from "../utils/wordExportUtils";

interface Props {
  entries: ScheduleEntry[];
  weekInfo: WeekInfo;
  profile: TeacherProfile;
  activeTemplate: ScheduleTemplateConfig;
  onOpenTimetable: () => void;
  onOpenCurriculum: () => void;
  onOpenCurriculumUpload?: () => void;
  onOpenTemplateModal: (tab?: "upload" | "export_combined") => void;
  onOpenProfile: () => void;
  onOpenAIAssistant: () => void;
}

export const Header: React.FC<Props> = ({
  entries,
  weekInfo,
  profile,
  activeTemplate,
  onOpenTimetable,
  onOpenCurriculum,
  onOpenCurriculumUpload,
  onOpenTemplateModal,
  onOpenProfile,
  onOpenAIAssistant,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = async () => {
    setIsExportingWord(true);
    try {
      await exportScheduleToWord(entries, weekInfo, profile, activeTemplate);
    } catch (err) {
      console.error("Lỗi xuất Word:", err);
      alert("Có lỗi khi tạo tệp Word (.docx). Vui lòng thử lại.");
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportExcel = () => {
    exportScheduleToExcel(entries, weekInfo, profile, activeTemplate);
  };

  const handleCopyWord = async () => {
    const success = await copyTableToWord("printable-schedule");
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      alert("Không thể sao chép bảng. Bạn có thể sử dụng tính năng Xuất File Word hoặc In trực tiếp.");
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white shadow-xs no-print sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-200">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Lịch Báo Giảng Tự Động
                  </h1>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/60">
                    Thứ 2 - Thứ 6
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {profile.schoolName} • GV: {profile.fullName}
                </p>
              </div>
            </div>

            {/* Mobile AI button */}
            <button
              onClick={onOpenAIAssistant}
              className="md:hidden flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 border border-amber-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              AI
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Input Documents */}
            <button
              id="btn-header-timetable"
              onClick={onOpenTimetable}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
              title="Xem và sửa Thời khóa biểu Thứ 2 - Thứ 6"
            >
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              TKB (22 tiết)
            </button>

            <button
              id="btn-header-curriculum"
              onClick={onOpenCurriculum}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
              title="Xem và sửa Kế hoạch bài dạy / Phân phối chương trình"
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              Kho PPCT
            </button>

            {/* BUTTON ÚP FILE MẪU LỊCH BÁO GIẢNG */}
            <button
              id="btn-header-upload-template"
              onClick={() => onOpenTemplateModal("upload")}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
              title="Úp file mẫu lịch báo giảng của trường (.xlsx, .docx) để lấy mẫu khi xuất lịch"
            >
              <UploadCloud className="h-3.5 w-3.5 text-amber-700" />
              Úp File Mẫu LBG
            </button>

            {/* BUTTON XUẤT LỊCH BÁO GIẢNG CHUNG */}
            <button
              id="btn-header-export-combined"
              onClick={() => onOpenTemplateModal("export_combined")}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100 transition shadow-2xs"
              title="Xuất Lịch Báo Giảng Chung cho nhiều tuần hoặc cả học kỳ ra file Word .docx"
            >
              <CalendarRange className="h-3.5 w-3.5 text-indigo-700" />
              Xuất Lịch Chung (Word)
            </button>

            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              title="Cài đặt thông tin giáo viên, trường học, ngày khai giảng"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              Cấu hình
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-0.5 hidden sm:block"></div>

            {/* PRIMARY: XUẤT FILE WORD (.DOCX) THEO MẪU */}
            <button
              id="btn-header-export-word"
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
              title="Xuất file Word .docx chuẩn theo mẫu trường (Font Times New Roman, A4 ngang)"
            >
              {isExportingWord ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Đang xuất Word...
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 text-blue-100" />
                  Xuất File Word (.docx)
                </>
              )}
            </button>

            {/* Secondary: Excel export */}
            <button
              id="btn-header-export-excel"
              onClick={handleExportExcel}
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              title="Xuất file Excel .xlsx phụ"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Excel (.xlsx)
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="In lịch báo giảng (chuẩn giấy A4 ngang)"
            >
              <Printer className="h-3.5 w-3.5" />
              In (A4)
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAIAssistant}
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-amber-600 hover:to-amber-700 transition"
              title="Trợ lý AI giải đáp thắc mắc về phân phối chương trình, lịch dạy bù"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              Trợ lý AI
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
