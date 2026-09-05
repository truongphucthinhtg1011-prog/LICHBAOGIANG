import React, { useState, useRef } from "react";
import { DayOfWeek, ScheduleEntry, ScheduleTemplateConfig, TeacherProfile } from "../types";
import { WeekInfo } from "../utils/dateUtils";
import {
  DEFAULT_COLUMNS,
  DEFAULT_TEMPLATE,
  SECONDARY_TEMPLATE,
  SECONDARY_COMPACT_TEMPLATE,
  SPECIALIST_TEMPLATE,
  parseUploadedTemplateFile,
} from "../utils/templateParser";
import {
  Edit3,
  Check,
  Undo2,
  UploadCloud,
  FileText,
  CheckCircle2,
  Sliders,
  CheckCheck,
  Loader2,
} from "lucide-react";

interface Props {
  entries: ScheduleEntry[];
  weekInfo: WeekInfo;
  profile: TeacherProfile;
  activeTemplate?: ScheduleTemplateConfig;
  onOpenTemplateModal?: (tab?: "upload" | "export_combined") => void;
  onSaveTemplate?: (template: ScheduleTemplateConfig) => void;
  onUpdateEntry: (id: string, updates: Partial<ScheduleEntry>) => void;
  onResetEntry: (id: string) => void;
}

const DAYS_VN: { day: DayOfWeek; name: string }[] = [
  { day: 2, name: "Thứ Hai" },
  { day: 3, name: "Thứ Ba" },
  { day: 4, name: "Thứ Tư" },
  { day: 5, name: "Thứ Năm" },
  { day: 6, name: "Thứ Sáu" },
];

export const ScheduleTable: React.FC<Props> = ({
  entries,
  weekInfo,
  profile,
  activeTemplate = DEFAULT_TEMPLATE,
  onOpenTemplateModal,
  onSaveTemplate,
  onUpdateEntry,
  onResetEntry,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editFields, setEditFields] = useState<{
    ppctPeriod: string;
    lessonTitle: string;
    equipment: string;
    notes: string;
  }>({
    ppctPeriod: "",
    lessonTitle: "",
    equipment: "",
    notes: "",
  });

  const startEdit = (entry: ScheduleEntry) => {
    setEditingId(entry.id);
    setEditFields({
      ppctPeriod: entry.ppctPeriod ? entry.ppctPeriod.toString() : "",
      lessonTitle: entry.lessonTitle || "",
      equipment: entry.equipment || "",
      notes: entry.notes || "",
    });
  };

  const saveEdit = (entry: ScheduleEntry) => {
    onUpdateEntry(entry.id, {
      ppctPeriod: editFields.ppctPeriod ? Number(editFields.ppctPeriod) : null,
      lessonTitle: editFields.lessonTitle,
      equipment: editFields.equipment,
      notes: editFields.notes,
      isCustomModified: true,
    });
    setEditingId(null);
  };

  // Handle direct file upload right from the table
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccessNotice(null);

    try {
      const parsedConfig = await parseUploadedTemplateFile(file);
      if (onSaveTemplate) {
        onSaveTemplate(parsedConfig);
      }
      setUploadSuccessNotice(
        `Đã áp dụng mẫu trường "${parsedConfig.name}" (${parsedConfig.columns.filter((c) => c.visible).length} cột) thành công!`
      );
      setTimeout(() => setUploadSuccessNotice(null), 6000);
    } catch (err) {
      console.error(err);
      alert("Không thể đọc tệp mẫu. Vui lòng kiểm tra định dạng .xlsx hoặc .docx.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Group entries by DayOfWeek
  const entriesByDay = new Map<DayOfWeek, ScheduleEntry[]>();
  DAYS_VN.forEach((d) => entriesByDay.set(d.day, []));

  entries.forEach((e) => {
    const list = entriesByDay.get(e.dayOfWeek) || [];
    list.push(e);
    entriesByDay.set(e.dayOfWeek, list);
  });

  const totalPeriodsThisWeek = entries.filter((e) => !e.isHoliday).length;

  // Compute active visible columns strictly from activeTemplate
  const currentColumns = activeTemplate?.columns || DEFAULT_COLUMNS;
  const visibleCols = currentColumns.filter((c) => c.visible !== false);
  const hasDayCol = visibleCols.some((c) => c.key === "dayOfWeek");
  const nonDayColsCount = visibleCols.filter((c) => c.key !== "dayOfWeek").length;

  return (
    <div
      id="printable-schedule"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm font-sans transition"
    >
      {/* Quick Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleQuickUpload}
        accept=".xlsx,.xls,.docx"
        className="hidden"
      />

      {/* Template Status & Quick Preset Bar (No Print) */}
      <div className="mb-5 space-y-2.5 rounded-xl bg-slate-50 border border-slate-200/90 p-3 text-xs no-print shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Mẫu Lịch Báo Giảng đang dùng:</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold px-2 py-0.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
              {activeTemplate.name}
            </span>
            {activeTemplate.sourceType?.startsWith("uploaded") && (
              <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px]">
                Mẫu trường nạp từ tệp
              </span>
            )}
            <span className="text-slate-500 text-[11px]">
              ({visibleCols.length} cột hiển thị)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
              title="Tải lên tệp mẫu Word (.docx) hoặc Excel (.xlsx) của trường để cập nhật ngay"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
              ) : (
                <UploadCloud className="h-3.5 w-3.5 text-amber-700" />
              )}
              {isUploading ? "Đang xử lý mẫu..." : "Úp Mẫu Trường (.docx / .xlsx)"}
            </button>

            <button
              onClick={() => onOpenTemplateModal?.("upload")}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Tùy chỉnh tiêu đề, các cột và thông tin người ký"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              Tùy chỉnh cột
            </button>

            <button
              onClick={() => onOpenTemplateModal?.("export_combined")}
              className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 hover:bg-blue-100 transition"
              title="Xuất file Word (.docx) hoặc Excel (.xlsx) theo đúng mẫu"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Xuất File Word / Excel
            </button>
          </div>
        </div>

        {/* Quick Presets Toggle Row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 text-[11px]">
          <span className="text-slate-500 font-medium mr-1">Chọn nhanh mẫu chuẩn:</span>
          {[
            { config: DEFAULT_TEMPLATE, label: "Mẫu Tiểu học (9 cột)" },
            { config: SECONDARY_TEMPLATE, label: "Mẫu THCS/THPT (8 cột)" },
            { config: SECONDARY_COMPACT_TEMPLATE, label: "Mẫu Rút gọn (7 cột)" },
            { config: SPECIALIST_TEMPLATE, label: "Mẫu Bộ môn (7 cột)" },
          ].map((preset) => (
            <button
              key={preset.config.id}
              onClick={() => onSaveTemplate && onSaveTemplate(preset.config)}
              className={`px-2 py-0.5 rounded transition ${
                activeTemplate.id === preset.config.id
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Upload Success Banner */}
        {uploadSuccessNotice && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 font-medium flex items-center gap-1.5 animate-in fade-in">
            <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* Official Header */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
          <div className="text-left space-y-0.5">
            <p className="font-semibold text-slate-600 uppercase tracking-wide">
              {activeTemplate?.schoolName || profile.schoolName || "TRƯỜNG TIỂU HỌC"}
            </p>
            <p className="font-bold text-slate-800 uppercase">
              {activeTemplate?.departmentName || profile.department || "TỔ CHUYÊN MÔN"}
            </p>
          </div>

          <div className="text-center flex-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
              {activeTemplate?.documentTitle || "LỊCH BÁO GIẢNG"}
            </h1>
            <p className="text-sm font-bold text-indigo-700 mt-0.5">
              TUẦN {weekInfo.weekNumber} ({weekInfo.rangeText})
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Năm học: {profile.academicYear} | Thứ 2 đến Thứ 6
            </p>
          </div>

          <div className="text-right space-y-0.5 hidden md:block">
            <p className="font-medium text-slate-600">
              Giáo viên:{" "}
              <strong className="text-slate-900 font-bold">
                {profile.fullName}
              </strong>
            </p>
            <p className="text-slate-500">
              Tổng số tiết: <span className="font-bold text-emerald-700">{totalPeriodsThisWeek} tiết</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Table - Dynamically Rendered to Match Active Template Columns */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs text-slate-800">
          <thead>
            <tr className="bg-slate-100/90 text-slate-800 font-bold border border-slate-300">
              {visibleCols.map((col) => {
                let colClass = "py-2.5 px-2 border border-slate-300 font-bold text-slate-800 ";
                if (col.align === "center") colClass += "text-center ";
                else if (col.align === "right") colClass += "text-right ";
                else colClass += "text-left ";

                // Sizing hints based on key
                if (col.key === "dayOfWeek") colClass += "w-28 ";
                else if (col.key === "session") colClass += "w-16 ";
                else if (col.key === "period") colClass += "w-14 ";
                else if (col.key === "className") colClass += "w-16 ";
                else if (col.key === "subject") colClass += "w-24 ";
                else if (col.key === "ppctPeriod") colClass += "w-16 ";
                else if (col.key === "lessonTitle") colClass += "min-w-[220px] ";
                else if (col.key === "equipment") colClass += "min-w-[150px] ";
                else if (col.key === "notes") colClass += "min-w-[120px] ";

                return (
                  <th key={col.key} className={colClass}>
                    {col.label}
                  </th>
                );
              })}
              <th className="py-2.5 px-2 border border-slate-300 text-center w-16 no-print">
                Sửa
              </th>
            </tr>
          </thead>
          <tbody>
            {DAYS_VN.map(({ day, name }) => {
              const dayEntries = entriesByDay.get(day) || [];
              const dayInfo = weekInfo.days[day];
              const hasEntries = dayEntries.length > 0;
              const rowSpanCount = hasEntries ? dayEntries.length : 1;

              return (
                <React.Fragment key={`day-group-${day}`}>
                  {hasEntries ? (
                    dayEntries.map((entry, index) => {
                      const isEditing = editingId === entry.id;
                      const isFirstRow = index === 0;

                      return (
                        <tr
                          key={entry.id}
                          className={`hover:bg-indigo-50/30 transition border-b border-slate-200 ${
                            entry.isHoliday ? "bg-red-50/40" : ""
                          }`}
                        >
                          {visibleCols.map((col) => {
                            // 1. Day of Week Column (Row-spanned across the day)
                            if (col.key === "dayOfWeek") {
                              if (!isFirstRow) return null;
                              return (
                                <td
                                  key={`col-day-${entry.id}`}
                                  rowSpan={rowSpanCount}
                                  className="py-3 px-2 text-center align-middle font-bold border border-slate-300 bg-slate-50/70"
                                >
                                  <div className="font-bold text-slate-800">{name}</div>
                                  <div className="text-[11px] font-medium text-indigo-700">
                                    {dayInfo.dateStr}
                                  </div>
                                  {entry.isHoliday && (
                                    <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                      Nghỉ lễ
                                    </span>
                                  )}
                                </td>
                              );
                            }

                            // 2. Session Column (Sáng / Chiều)
                            if (col.key === "session") {
                              return (
                                <td
                                  key={`col-session-${entry.id}`}
                                  className="py-2 px-1 text-center font-medium border border-slate-300"
                                >
                                  {entry.session === "morning" ? (
                                    <span className="text-amber-700 font-semibold">Sáng</span>
                                  ) : (
                                    <span className="text-blue-700 font-semibold">Chiều</span>
                                  )}
                                </td>
                              );
                            }

                            // 3. Period Column
                            if (col.key === "period") {
                              return (
                                <td
                                  key={`col-period-${entry.id}`}
                                  className="py-2 px-1 text-center font-bold text-slate-700 border border-slate-300"
                                >
                                  {entry.period}
                                </td>
                              );
                            }

                            // 4. Class Name Column
                            if (col.key === "className") {
                              return (
                                <td
                                  key={`col-class-${entry.id}`}
                                  className="py-2 px-1 text-center font-bold text-indigo-900 border border-slate-300"
                                >
                                  {entry.className}
                                </td>
                              );
                            }

                            // 5. Subject Column
                            if (col.key === "subject") {
                              return (
                                <td
                                  key={`col-subject-${entry.id}`}
                                  className="py-2 px-2 text-center font-medium text-slate-800 border border-slate-300"
                                >
                                  {entry.subject}
                                </td>
                              );
                            }

                            // 6. PPCT Period Column
                            if (col.key === "ppctPeriod") {
                              return (
                                <td
                                  key={`col-ppct-${entry.id}`}
                                  className="py-2 px-1 text-center font-bold text-emerald-800 bg-emerald-50/20 border border-slate-300"
                                >
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editFields.ppctPeriod}
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          ppctPeriod: e.target.value,
                                        })
                                      }
                                      className="w-12 rounded border border-indigo-400 p-1 text-center text-xs font-bold"
                                    />
                                  ) : (
                                    entry.ppctPeriod ?? "—"
                                  )}
                                </td>
                              );
                            }

                            // 7. Lesson Title Column
                            if (col.key === "lessonTitle") {
                              return (
                                <td
                                  key={`col-title-${entry.id}`}
                                  className="py-2 px-3 border border-slate-300"
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editFields.lessonTitle}
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          lessonTitle: e.target.value,
                                        })
                                      }
                                      className="w-full rounded border border-indigo-400 p-1.5 text-xs font-medium"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-between gap-1">
                                      <span
                                        className={
                                          entry.isHoliday
                                            ? "text-red-700 font-semibold italic"
                                            : "font-medium text-slate-900"
                                        }
                                      >
                                        {entry.lessonTitle}
                                      </span>
                                      {entry.isCustomModified && (
                                        <span
                                          className="text-[10px] text-amber-600 font-bold shrink-0 no-print"
                                          title="Đã chỉnh sửa thủ công"
                                        >
                                          [Tùy chỉnh]
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            // 8. Equipment Column
                            if (col.key === "equipment") {
                              return (
                                <td
                                  key={`col-equip-${entry.id}`}
                                  className="py-2 px-2 text-slate-700 border border-slate-300"
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editFields.equipment}
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          equipment: e.target.value,
                                        })
                                      }
                                      className="w-full rounded border border-indigo-400 p-1.5 text-xs"
                                      placeholder="Thiết bị, máy tính..."
                                    />
                                  ) : (
                                    entry.equipment || "—"
                                  )}
                                </td>
                              );
                            }

                            // 9. Notes Column
                            if (col.key === "notes") {
                              return (
                                <td
                                  key={`col-notes-${entry.id}`}
                                  className="py-2 px-2 text-slate-600 border border-slate-300"
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editFields.notes}
                                      onChange={(e) =>
                                        setEditFields({
                                          ...editFields,
                                          notes: e.target.value,
                                        })
                                      }
                                      className="w-full rounded border border-indigo-400 p-1.5 text-xs"
                                      placeholder="Ghi chú..."
                                    />
                                  ) : (
                                    entry.notes || ""
                                  )}
                                </td>
                              );
                            }

                            return (
                              <td key={`col-default-${col.key}-${entry.id}`} className="py-2 px-2 border border-slate-300">
                                —
                              </td>
                            );
                          })}

                          {/* Action Column (Hidden on print) */}
                          <td className="py-2 px-1 text-center border border-slate-300 no-print">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => saveEdit(entry)}
                                  className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                                  title="Lưu sửa đổi"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="rounded bg-slate-200 p-1 text-slate-700 hover:bg-slate-300"
                                  title="Hủy"
                                >
                                  <Undo2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => startEdit(entry)}
                                  className="rounded p-1 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700"
                                  title="Sửa thông tin tiết này"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                {entry.isCustomModified && (
                                  <button
                                    onClick={() => onResetEntry(entry.id)}
                                    className="rounded p-1 text-amber-500 hover:bg-amber-100"
                                    title="Khôi phục nội dung tự động ban đầu"
                                  >
                                    <Undo2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    /* Day with no timetable slots */
                    <tr className="border-b border-slate-200 bg-slate-50/40">
                      {hasDayCol && (
                        <td className="py-3 px-2 text-center align-middle font-bold border border-slate-300 bg-slate-50">
                          <div className="font-bold text-slate-700">{name}</div>
                          <div className="text-[11px] font-medium text-slate-500">
                            {dayInfo.dateStr}
                          </div>
                        </td>
                      )}
                      <td
                        colSpan={hasDayCol ? nonDayColsCount : visibleCols.length}
                        className="py-3 px-4 text-center italic text-slate-400 border border-slate-300"
                      >
                        Không có tiết giảng dạy theo Thời khóa biểu
                      </td>
                      <td className="border border-slate-300 no-print"></td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Official Signature Footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs">
        <div className="grid grid-cols-2 text-center">
          <div className="space-y-16">
            <div>
              <p className="font-bold text-slate-800 uppercase">
                {activeTemplate?.signerLeftRole || "DUYỆT CỦA TỔ CHUYÊN MÔN / BAN GIÁM HIỆU"}
              </p>
              <p className="text-[11px] italic text-slate-500">
                {activeTemplate?.signerLeftNote || "(Ký và ghi rõ họ tên)"}
              </p>
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <p className="italic text-slate-600 mb-0.5">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
              <p className="font-bold text-slate-800 uppercase">
                {activeTemplate?.signerRightRole || "GIÁO VIÊN BỘ MÔN"}
              </p>
              <p className="text-[11px] italic text-slate-500">
                {activeTemplate?.signerRightNote || "(Ký và ghi rõ họ tên)"}
              </p>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {profile.fullName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
