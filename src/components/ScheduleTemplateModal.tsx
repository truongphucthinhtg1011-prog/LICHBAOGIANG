import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Settings2,
  CalendarRange,
  FileText,
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  HolidayEntry,
  ScheduleEntry,
  ScheduleTemplateConfig,
  SubjectCurriculum,
  TeacherProfile,
  TimetableSlot,
} from "../types";
import {
  DEFAULT_TEMPLATE,
  SECONDARY_TEMPLATE,
  SECONDARY_COMPACT_TEMPLATE,
  SPECIALIST_TEMPLATE,
  generateBlankTemplateExcel,
  parseUploadedTemplateFile,
} from "../utils/templateParser";
import {
  CombinedExportOptions,
  exportCombinedScheduleToExcel,
  exportScheduleToExcel,
} from "../utils/exportUtils";
import {
  exportCombinedScheduleToWord,
  exportScheduleToWord,
} from "../utils/wordExportUtils";
import { WeekInfo } from "../utils/dateUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTemplate: ScheduleTemplateConfig;
  onSaveTemplate: (template: ScheduleTemplateConfig) => void;
  currentWeekEntries: ScheduleEntry[];
  weekInfo: WeekInfo;
  profile: TeacherProfile;
  timetable: TimetableSlot[];
  curriculums: SubjectCurriculum[];
  holidays: HolidayEntry[];
  customOverrides: Record<string, Partial<ScheduleEntry>>;
  defaultTab?: "upload" | "export_combined";
}

export const ScheduleTemplateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTemplate,
  onSaveTemplate,
  currentWeekEntries,
  weekInfo,
  profile,
  timetable,
  curriculums,
  holidays,
  customOverrides,
  defaultTab = "upload",
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "export_combined">(defaultTab);
  const [template, setTemplate] = useState<ScheduleTemplateConfig>(activeTemplate);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Combined Export Form State
  const [exportFormat, setExportFormat] = useState<"word" | "excel">("word");
  const [startWeek, setStartWeek] = useState<number>(1);
  const [endWeek, setEndWeek] = useState<number>(18); // Default Semester 1
  const [exportMode, setExportMode] = useState<"multi_sheets" | "single_sheet_continuous">(
    "multi_sheets"
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessNotice, setExportSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccessMsg(null);

    try {
      const parsedConfig = await parseUploadedTemplateFile(file);
      setTemplate(parsedConfig);
      onSaveTemplate(parsedConfig);
      setUploadSuccessMsg(
        `Đã nạp thành công mẫu "${file.name}"! Toàn bộ cấu trúc cột, tiêu đề trường và chữ ký đã sẵn sàng để xuất lịch.`
      );
    } catch (err: any) {
      console.error(err);
      alert("Không thể đọc tệp mẫu. Vui lòng kiểm tra định dạng .xlsx, .xls hoặc .docx.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyPreset = (preset: ScheduleTemplateConfig) => {
    const updated = {
      ...preset,
      schoolName: profile.schoolName || preset.schoolName,
      departmentName: profile.department || preset.departmentName,
    };
    setTemplate(updated);
    onSaveTemplate(updated);
    setUploadSuccessMsg(`Đã chuyển sang ${preset.name}!`);
  };

  const handleDownloadBlankTemplate = () => {
    generateBlankTemplateExcel(template);
  };

  const handleToggleColumnVisible = (key: string) => {
    const updatedColumns = template.columns.map((c) =>
      c.key === key ? { ...c, visible: !c.visible } : c
    );
    const updated = { ...template, columns: updatedColumns };
    setTemplate(updated);
    onSaveTemplate(updated);
  };

  const handleColumnLabelChange = (key: string, newLabel: string) => {
    const updatedColumns = template.columns.map((c) =>
      c.key === key ? { ...c, label: newLabel } : c
    );
    const updated = { ...template, columns: updatedColumns };
    setTemplate(updated);
    onSaveTemplate(updated);
  };

  // Export Current Week
  const handleExportCurrentWeek = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "word") {
        await exportScheduleToWord(currentWeekEntries, weekInfo, profile, template);
      } else {
        exportScheduleToExcel(currentWeekEntries, weekInfo, profile, template);
      }
    } catch (err) {
      console.error(err);
      alert(`Có lỗi khi xuất tệp ${exportFormat === "word" ? "Word (.docx)" : "Excel"}. Vui lòng thử lại.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Combined Schedule
  const handleExportCombined = async () => {
    if (startWeek < 1 || endWeek < startWeek || endWeek > profile.totalWeeks) {
      alert(`Vui lòng chọn tuần hợp lệ từ Tuần 1 đến Tuần ${profile.totalWeeks}.`);
      return;
    }

    setIsExporting(true);
    setExportSuccessNotice(null);

    try {
      if (exportFormat === "word") {
        await exportCombinedScheduleToWord({
          startWeek,
          endWeek,
          timetable,
          curriculums,
          startDateSemester1: profile.startDateSemester1,
          holidays,
          customOverrides,
          profile,
          template,
        });
        setExportSuccessNotice(
          `Đã xuất thành công tệp Word (.docx) Lịch Báo Giảng Chung từ Tuần ${startWeek} đến Tuần ${endWeek} theo đúng mẫu "${template.name}"!`
        );
      } else {
        const options: CombinedExportOptions = {
          startWeek,
          endWeek,
          mode: exportMode,
          timetable,
          curriculums,
          startDateSemester1: profile.startDateSemester1,
          holidays,
          customOverrides,
          profile,
          template,
        };

        exportCombinedScheduleToExcel(options);
        setExportSuccessNotice(
          `Đã xuất thành công tệp Excel (.xlsx) Lịch Báo Giảng Chung từ Tuần ${startWeek} đến Tuần ${endWeek} theo mẫu "${template.name}"!`
        );
      }
    } catch (err) {
      console.error(err);
      alert(`Có lỗi khi tạo tệp ${exportFormat === "word" ? "Word (.docx)" : "Excel (.xlsx)"}. Vui lòng thử lại.`);
    } finally {
      setIsExporting(false);
    }
  };

  const setSemesterRange = (sem: 1 | 2 | "full") => {
    if (sem === 1) {
      setStartWeek(1);
      setEndWeek(18);
    } else if (sem === 2) {
      setStartWeek(19);
      setEndWeek(profile.totalWeeks || 35);
    } else {
      setStartWeek(1);
      setEndWeek(profile.totalWeeks || 35);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  File Mẫu & Xuất Lịch Báo Giảng Chung
                </h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  Chuẩn Word .docx
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Úp file mẫu của trường để lấy mẫu chuẩn khi xuất Lịch báo giảng tuần và Lịch báo giảng chung ra file Word.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 text-sm">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 font-semibold transition ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            1. Úp & Cài Đặt File Mẫu Trường
          </button>

          <button
            onClick={() => setActiveTab("export_combined")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 font-semibold transition ${
              activeTab === "export_combined"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarRange className="h-4 w-4" />
            2. Xuất Lịch Báo Giảng Chung (Word .docx)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* TAB 1: UPLOAD & CONFIGURE TEMPLATE */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              {/* Active Template Banner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Mẫu đang áp dụng xuất file:
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {template.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {template.fileName
                        ? `Tệp đã úp: ${template.fileName} (${(template.fileSize ? (template.fileSize / 1024).toFixed(1) + " KB" : "")})`
                        : "Mẫu tích hợp chuẩn Bộ Giáo dục & Đào tạo"}
                      {" • "}
                      Số cột hiển thị: <strong className="text-emerald-800">{template.columns.filter((c) => c.visible).length} cột</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleDownloadBlankTemplate}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    title="Tải tệp Excel mẫu trống về máy để xem trước"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-600" />
                    Tải mẫu Excel trống
                  </button>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 p-6 text-center hover:bg-indigo-50/60 transition">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.docx,.csv"
                  className="hidden"
                  id="template-file-input"
                />
                <label
                  htmlFor="template-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2.5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition">
                    {isUploading ? (
                      <RefreshCw className="h-7 w-7 animate-spin" />
                    ) : (
                      <UploadCloud className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Bấm vào đây để <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-2">Úp File Mẫu Lịch Báo Giảng Của Trường</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Hỗ trợ tệp Microsoft Excel (<strong>.xlsx, .xls</strong>) hoặc Word (<strong>.docx</strong>)
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 shadow-2xs">
                    Hệ thống tự nhận dạng tiêu đề, các cột, và khung chữ ký Ban Giám Hiệu
                  </span>
                </label>
              </div>

              {/* Upload Success Alert */}
              {uploadSuccessMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              {/* Preset Templates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Hoặc chọn nhanh mẫu chuẩn có sẵn:
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleApplyPreset(DEFAULT_TEMPLATE)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between ${
                      template.id === DEFAULT_TEMPLATE.id
                        ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {DEFAULT_TEMPLATE.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Chuẩn 9 cột: Thứ/ngày, Buổi, Tiết TKB, Lớp, Môn, Tiết PPCT, Tên bài, ĐDDH, Ghi chú
                      </p>
                    </div>
                    {template.id === DEFAULT_TEMPLATE.id && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleApplyPreset(SECONDARY_TEMPLATE)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between ${
                      template.id === SECONDARY_TEMPLATE.id
                        ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {SECONDARY_TEMPLATE.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mẫu 8 cột gọn cho THCS/THPT theo quy định Sở Giáo Dục
                      </p>
                    </div>
                    {template.id === SECONDARY_TEMPLATE.id && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleApplyPreset(SECONDARY_COMPACT_TEMPLATE)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between ${
                      template.id === SECONDARY_COMPACT_TEMPLATE.id
                        ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {SECONDARY_COMPACT_TEMPLATE.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mẫu 7 cột tinh gọn (lược bớt cột Buổi và ĐDDH)
                      </p>
                    </div>
                    {template.id === SECONDARY_COMPACT_TEMPLATE.id && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleApplyPreset(SPECIALIST_TEMPLATE)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between ${
                      template.id === SPECIALIST_TEMPLATE.id
                        ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {SPECIALIST_TEMPLATE.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mẫu 7 cột cho Giáo viên Bộ môn (lược bớt cột Môn)
                      </p>
                    </div>
                    {template.id === SPECIALIST_TEMPLATE.id && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Template Text Header Customization */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Tùy chỉnh thông tin tiêu đề và chữ ký trên file xuất
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tiêu đề văn bản:
                    </label>
                    <input
                      type="text"
                      value={template.documentTitle}
                      onChange={(e) => {
                        const updated = { ...template, documentTitle: e.target.value };
                        setTemplate(updated);
                        onSaveTemplate(updated);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Đơn vị quản lý cấp trên:
                    </label>
                    <input
                      type="text"
                      value={template.upperDepartment || ""}
                      onChange={(e) => {
                        const updated = { ...template, upperDepartment: e.target.value };
                        setTemplate(updated);
                        onSaveTemplate(updated);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Chức danh người duyệt (bên trái):
                    </label>
                    <input
                      type="text"
                      value={template.signerLeftRole}
                      onChange={(e) => {
                        const updated = { ...template, signerLeftRole: e.target.value };
                        setTemplate(updated);
                        onSaveTemplate(updated);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Chức danh người lập (bên phải):
                    </label>
                    <input
                      type="text"
                      value={template.signerRightRole}
                      onChange={(e) => {
                        const updated = { ...template, signerRightRole: e.target.value };
                        setTemplate(updated);
                        onSaveTemplate(updated);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Column Mapping & Customization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Cấu hình các cột dữ liệu trên bảng:
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Bấm vào checkbox để ẩn/hiện cột, sửa tên cột trực tiếp
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-12 bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                    <div className="col-span-1 text-center">Bật</div>
                    <div className="col-span-5">Tên Cột Trên File Mẫu</div>
                    <div className="col-span-4">Trường Dữ Liệu Tương Ứng</div>
                    <div className="col-span-2 text-right">Độ Rộng</div>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {template.columns.map((col) => (
                      <div
                        key={col.key}
                        className="grid grid-cols-12 items-center px-3 py-2 text-xs hover:bg-slate-50"
                      >
                        <div className="col-span-1 text-center">
                          <input
                            type="checkbox"
                            checked={col.visible}
                            onChange={() => handleToggleColumnVisible(col.key)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                        <div className="col-span-5 pr-2">
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => handleColumnLabelChange(col.key, e.target.value)}
                            className="w-full rounded border border-slate-200 bg-slate-50/50 px-2 py-1 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div className="col-span-4 text-slate-600 font-mono text-[11px]">
                          {col.key}
                        </div>
                        <div className="col-span-2 text-right text-slate-500 text-[11px]">
                          {col.width || 18} ch
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT COMBINED SCHEDULE */}
          {activeTab === "export_combined" && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Xuất Lịch Báo Giảng Chung Toàn Bộ Học Kỳ Ra File Word (.docx)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hệ thống sẽ tự động tính toán toàn bộ tiết dạy cho các tuần từ Thứ 2 đến Thứ 6, lũy tiến số tiết PPCT chính xác, trừ ngày nghỉ lễ và xuất ra tệp Word (.docx) chuẩn theo mẫu trường{" "}
                    <strong className="text-blue-900 font-bold">"{template.name}"</strong>.
                  </p>
                </div>
              </div>

              {/* Format Selection (Word vs Excel) */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Chọn định dạng tệp xuất ra:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat("word")}
                    className={`p-4 rounded-xl border text-left transition ${
                      exportFormat === "word"
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-bold text-slate-900">
                          Tệp Microsoft Word (.docx)
                        </p>
                      </div>
                      <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                        Mặc định theo mẫu
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Xuất tệp Word .docx bám sát mẫu trường: bảng khổ A4 ngang, phông Times New Roman 11pt, đủ Quốc hiệu, Tiêu đề, Bảng và Chữ ký. Mỗi tuần tự động bắt đầu ở trang mới.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("excel")}
                    className={`p-4 rounded-xl border text-left transition ${
                      exportFormat === "excel"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-bold text-slate-900">
                          Tệp Bảng Tính Excel (.xlsx)
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        Tùy chọn
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Xuất tệp bảng tính Excel .xlsx đa sheet (mỗi tuần 1 sheet) hoặc 1 bảng nối tiếp để dễ dàng chỉnh sửa số liệu số học.
                    </p>
                  </button>
                </div>
              </div>

              {/* Range Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Chọn khoảng tuần cần xuất:
                </label>

                {/* Preset Semester Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSemesterRange(1)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
                      startWeek === 1 && endWeek === 18
                        ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Học kỳ 1 (Tuần 1 - 18)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSemesterRange(2)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
                      startWeek === 19 && endWeek === (profile.totalWeeks || 35)
                        ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Học kỳ 2 (Tuần 19 - {profile.totalWeeks || 35})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSemesterRange("full")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
                      startWeek === 1 && endWeek === (profile.totalWeeks || 35)
                        ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Cả năm học (Tuần 1 - {profile.totalWeeks || 35})
                  </button>
                </div>

                {/* Number Inputs */}
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Từ Tuần:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={profile.totalWeeks || 35}
                      value={startWeek}
                      onChange={(e) => setStartWeek(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Đến Tuần:
                    </label>
                    <input
                      type="number"
                      min={startWeek}
                      max={profile.totalWeeks || 35}
                      value={endWeek}
                      onChange={(e) => setEndWeek(Math.min(profile.totalWeeks || 35, Number(e.target.value)))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Format Specific Configuration */}
              {exportFormat === "word" ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Quy chuẩn tệp Word (.docx) được tạo ra:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Khổ giấy: <strong>A4 Nằm ngang (Landscape)</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Phông chữ: <strong>Times New Roman (10.5 - 14pt)</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Tiêu đề: <strong>Quốc hiệu & Tên trường/tổ bộ môn</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Ngắt trang: <strong>Mỗi tuần 1 trang riêng biệt</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Ký duyệt: <strong>Khung ký Tổ trưởng & Giáo viên</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Tương thích: <strong>Word 2010 - 365, Google Docs</strong>
                    </div>
                  </div>
                </div>
              ) : (
                /* Excel Mode Selection */
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Chọn quy cách xuất tệp Excel (.xlsx):
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExportMode("multi_sheets")}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        exportMode === "multi_sheets"
                          ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-bold text-slate-900">
                          Mỗi Tuần 1 Sheet
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Tạo 1 tệp Excel duy nhất, bên trong có Sheet "Tuần 1", Sheet "Tuần 2", ..., "Tuần {endWeek}". Rất tiện theo dõi và in ấn.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportMode("single_sheet_continuous")}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        exportMode === "single_sheet_continuous"
                          ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-bold text-slate-900">
                          Một Bảng Nối Tiếp Chung
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Toàn bộ các tuần được xếp liên tục theo thứ tự thời gian trong 1 sheet duy nhất.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giáo viên giảng dạy:</span>
                  <span className="font-bold text-slate-800">{profile.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Định dạng xuất ra:</span>
                  <span className="font-bold text-blue-700 uppercase">
                    {exportFormat === "word" ? "Tệp Microsoft Word (.docx)" : "Tệp Microsoft Excel (.xlsx)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tuần xuất:</span>
                  <span className="font-bold text-indigo-700">{endWeek - startWeek + 1} tuần (Từ Tuần {startWeek} đến Tuần {endWeek})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng số tiết dự kiến:</span>
                  <span className="font-bold text-emerald-700">~{(endWeek - startWeek + 1) * timetable.length} tiết</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Áp dụng mẫu:</span>
                  <span className="font-bold text-slate-700">{template.name}</span>
                </div>
              </div>

              {/* Success Notification */}
              {exportSuccessNotice && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-100/70 p-3 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{exportSuccessNotice}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportCurrentWeek}
                  disabled={isExporting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  Chỉ Xuất Riêng Tuần {weekInfo.weekNumber} ({exportFormat === "word" ? ".docx" : ".xlsx"})
                </button>

                <button
                  type="button"
                  onClick={handleExportCombined}
                  disabled={isExporting}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 ${
                    exportFormat === "word"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                      : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                  }`}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang tạo tệp {exportFormat === "word" ? "Word (.docx)..." : "Excel (.xlsx)..."}
                    </>
                  ) : exportFormat === "word" ? (
                    <>
                      <FileText className="h-4 w-4" />
                      Xuất Lịch Báo Giảng Chung Ngay (.docx Word)
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Xuất Lịch Báo Giảng Chung Ngay (.xlsx)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            * Mọi thay đổi về mẫu tệp và cột sẽ được tự động lưu vào bộ nhớ trình duyệt.
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
