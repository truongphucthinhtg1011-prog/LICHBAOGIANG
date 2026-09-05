import React, { useState } from "react";
import { DayOfWeek, Session, TimetableSlot } from "../types";
import { X, Plus, Trash2, Sparkles, Calendar, Table, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { initialTimetable } from "../data/defaultData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  timetable: TimetableSlot[];
  onSave: (slots: TimetableSlot[]) => void;
}

const DAYS: { day: DayOfWeek; name: string }[] = [
  { day: 2, name: "Thứ 2" },
  { day: 3, name: "Thứ 3" },
  { day: 4, name: "Thứ 4" },
  { day: 5, name: "Thứ 5" },
  { day: 6, name: "Thứ 6" },
];

const MORNING_PERIODS = [
  { period: 1, label: "Tiết 1", time: "7h00 - 7h35" },
  { period: 2, label: "Tiết 2", time: "7h40 - 8h15" },
  { period: 3, label: "Tiết 3", time: "8h20 - 8h55" },
  { period: 4, label: "Tiết 4", time: "9h25 - 10h00" },
];

const AFTERNOON_PERIODS = [
  { period: 5, label: "Tiết 5", time: "14h00 - 14h35" },
  { period: 6, label: "Tiết 6", time: "14h40 - 15h15" },
  { period: 7, label: "Tiết 7", time: "15h20 - 15h55" },
];

export const TimetableEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  timetable,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<"grid" | "import">("grid");
  const [slots, setSlots] = useState<TimetableSlot[]>([...timetable]);

  React.useEffect(() => {
    if (isOpen) {
      setSlots([...timetable]);
    }
  }, [isOpen, timetable]);

  const [selectedSlot, setSelectedSlot] = useState<{
    day: DayOfWeek;
    session: Session;
    period: number;
    existing?: TimetableSlot;
  } | null>(null);

  // Edit slot form state
  const [editClass, setEditClass] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editRoom, setEditRoom] = useState("");

  // AI Import State
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Open slot editor
  const handleOpenSlot = (day: DayOfWeek, session: Session, period: number) => {
    const existing = slots.find(
      (s) => s.dayOfWeek === day && s.session === session && s.period === period
    );
    setSelectedSlot({ day, session, period, existing });
    setEditClass(existing ? existing.className : "");
    setEditSubject(existing ? existing.subject : "Tin học");
    setEditRoom(existing ? existing.room || "" : "Phòng máy");
  };

  const handleSaveSlot = () => {
    if (!selectedSlot) return;
    if (!editClass.trim() || !editSubject.trim()) {
      alert("Vui lòng nhập tên Lớp và Môn học");
      return;
    }

    const filtered = slots.filter(
      (s) =>
        !(
          s.dayOfWeek === selectedSlot.day &&
          s.session === selectedSlot.session &&
          s.period === selectedSlot.period
        )
    );

    const newSlot: TimetableSlot = {
      id: selectedSlot.existing?.id || `tkb-${Date.now()}-${Math.random()}`,
      dayOfWeek: selectedSlot.day,
      session: selectedSlot.session,
      period: selectedSlot.period,
      className: editClass.trim().toUpperCase(),
      subject: editSubject.trim(),
      room: editRoom.trim() || undefined,
    };

    setSlots([...filtered, newSlot]);
    setSelectedSlot(null);
  };

  const handleDeleteSlot = () => {
    if (!selectedSlot) return;
    setSlots(
      slots.filter(
        (s) =>
          !(
            s.dayOfWeek === selectedSlot.day &&
            s.session === selectedSlot.session &&
            s.period === selectedSlot.period
          )
      )
    );
    setSelectedSlot(null);
  };

  // AI Parse Timetable
  const handleAIParse = async () => {
    if (!rawText.trim()) {
      setParseError("Vui lòng dán nội dung thời khóa biểu vào khung");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseSuccess(null);

    try {
      const response = await fetch("/api/gemini/parse-tkb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể phân tích tài liệu TKB");
      }

      const parsedSlots: TimetableSlot[] = (data.slots || []).map((s: any, idx: number) => ({
        id: `parsed-${Date.now()}-${idx}`,
        dayOfWeek: Number(s.dayOfWeek) as DayOfWeek,
        session: s.session === "afternoon" ? "afternoon" : "morning",
        period: Number(s.period),
        className: String(s.className || "").toUpperCase(),
        subject: String(s.subject || ""),
        room: s.room ? String(s.room) : undefined,
      }));

      if (parsedSlots.length === 0) {
        setParseError("Không tìm thấy tiết dạy nào trong tài liệu. Vui lòng kiểm tra lại văn bản.");
      } else {
        setSlots(parsedSlots);
        setParseSuccess(`Đã trích xuất thành công ${parsedSlots.length} tiết dạy từ Thứ 2 đến Thứ 6!`);
        setActiveTab("grid");
      }
    } catch (err: any) {
      setParseError(err.message || "Lỗi kết nối đến máy chủ AI");
    } finally {
      setIsParsing(false);
    }
  };

  // Reset to default sample timetable
  const handleLoadSample = () => {
    if (confirm("Tải lại thời khóa biểu gốc của Thầy Thoàn (22 tiết/tuần)? Tất cả các tiết dạy sẽ được cập nhật lại theo thời khóa biểu chuẩn.")) {
      setSlots([...initialTimetable]);
    }
  };

  const handleApplyAll = () => {
    onSave(slots);
    onClose();
  };

  const totalPeriods = slots.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Thời Khóa Biểu Giảng Dạy (Thứ 2 đến Thứ 6)
              </h3>
              <p className="text-xs text-slate-500">
                Áp dụng từ <span className="font-semibold text-slate-700">07/9/2026 (Tuần 01)</span> • Tổng cộng: <span className="font-semibold text-indigo-600">{totalPeriods} tiết/tuần</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-xs"
              title="Khôi phục TKB chuẩn của Thầy Thoàn (22 tiết)"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
              TKB Thầy Thoàn
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("grid")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "grid"
                ? "border-indigo-600 text-indigo-600 bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Table className="h-4 w-4" />
            Bảng Thời Khóa Biểu (Lưới)
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "import"
                ? "border-indigo-600 text-indigo-600 bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Dán / Nhập tài liệu TKB bằng AI
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "grid" ? (
            <div className="space-y-6">
              {/* Note summary banner */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-2.5 text-xs text-indigo-900 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold">Thời khóa biểu Thầy Thoàn (Năm học 2026-2027):</span> TH khối 2, 3, 4, 5: 13 tiết • CN khối 4, 5: 6 tiết • QLPM: 3 tiết
                </div>
                <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  Tổng 22 tiết/tuần
                </span>
              </div>

              {/* Morning Session */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      Buổi Sáng (Tiết 1 - 4)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Giờ học: 7h00 - 10h00</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-xs font-semibold text-slate-700">
                        <th className="w-28 py-2.5 px-3 border-r border-b border-slate-200">Tiết / Giờ</th>
                        {DAYS.map((d) => (
                          <th key={d.day} className="py-2.5 px-3 border-r border-b border-slate-200">
                            {d.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MORNING_PERIODS.map((item) => (
                        <tr key={`morning-${item.period}`} className="border-b border-slate-200 hover:bg-slate-50/50">
                          <td className="font-semibold text-xs text-slate-700 bg-slate-50/80 border-r border-slate-200 py-3 px-2">
                            <div>{item.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{item.time}</div>
                          </td>
                          {DAYS.map((d) => {
                            const slot = slots.find(
                              (s) => s.dayOfWeek === d.day && s.session === "morning" && s.period === item.period
                            );
                            return (
                              <td
                                key={`${d.day}-m-${item.period}`}
                                onClick={() => handleOpenSlot(d.day, "morning", item.period)}
                                className="p-1.5 border-r border-slate-200 cursor-pointer transition hover:bg-indigo-50/60"
                              >
                                {slot ? (
                                  <div className={`rounded-lg p-2 text-left shadow-xs border ${
                                    slot.subject === "Tin học"
                                      ? "bg-indigo-50 border-indigo-200"
                                      : slot.subject === "Công nghệ"
                                      ? "bg-emerald-50 border-emerald-200"
                                      : "bg-amber-50 border-amber-200"
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <span className={`font-bold text-xs ${
                                        slot.subject === "Tin học"
                                          ? "text-indigo-900"
                                          : slot.subject === "Công nghệ"
                                          ? "text-emerald-900"
                                          : "text-amber-900"
                                      }`}>
                                        {slot.className}
                                      </span>
                                      <span className="text-[10px] text-slate-400">{slot.room || ""}</span>
                                    </div>
                                    <div className={`text-xs font-medium truncate ${
                                      slot.subject === "Tin học"
                                        ? "text-indigo-700"
                                        : slot.subject === "Công nghệ"
                                        ? "text-emerald-700"
                                        : "text-amber-700"
                                    }`}>
                                      {slot.subject}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-12 flex items-center justify-center text-slate-300 hover:text-indigo-400">
                                    <Plus className="h-4 w-4" />
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Afternoon Session */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      Buổi Chiều (Tiết 5 - 7)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Giờ học: 14h00 - 15h55</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-xs font-semibold text-slate-700">
                        <th className="w-28 py-2.5 px-3 border-r border-b border-slate-200">Tiết / Giờ</th>
                        {DAYS.map((d) => (
                          <th key={d.day} className="py-2.5 px-3 border-r border-b border-slate-200">
                            {d.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {AFTERNOON_PERIODS.map((item) => (
                        <tr key={`afternoon-${item.period}`} className="border-b border-slate-200 hover:bg-slate-50/50">
                          <td className="font-semibold text-xs text-slate-700 bg-slate-50/80 border-r border-slate-200 py-3 px-2">
                            <div>{item.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{item.time}</div>
                          </td>
                          {DAYS.map((d) => {
                            const slot = slots.find(
                              (s) => s.dayOfWeek === d.day && s.session === "afternoon" && s.period === item.period
                            );
                            return (
                              <td
                                key={`${d.day}-a-${item.period}`}
                                onClick={() => handleOpenSlot(d.day, "afternoon", item.period)}
                                className="p-1.5 border-r border-slate-200 cursor-pointer transition hover:bg-blue-50/60"
                              >
                                {slot ? (
                                  <div className={`rounded-lg p-2 text-left shadow-xs border ${
                                    slot.subject === "Tin học"
                                      ? "bg-blue-50 border-blue-200"
                                      : slot.subject === "Công nghệ"
                                      ? "bg-emerald-50 border-emerald-200"
                                      : "bg-amber-50 border-amber-200"
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <span className={`font-bold text-xs ${
                                        slot.subject === "Tin học"
                                          ? "text-blue-900"
                                          : slot.subject === "Công nghệ"
                                          ? "text-emerald-900"
                                          : "text-amber-900"
                                      }`}>
                                        {slot.className}
                                      </span>
                                      <span className="text-[10px] text-slate-400">{slot.room || ""}</span>
                                    </div>
                                    <div className={`text-xs font-medium truncate ${
                                      slot.subject === "Tin học"
                                        ? "text-blue-700"
                                        : slot.subject === "Công nghệ"
                                        ? "text-emerald-700"
                                        : "text-amber-700"
                                    }`}>
                                      {slot.subject}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-12 flex items-center justify-center text-slate-300 hover:text-blue-400">
                                    <Plus className="h-4 w-4" />
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* AI Import Tab */
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="rounded-xl bg-amber-50/80 p-4 border border-amber-200 text-amber-900 text-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Nhập tài liệu TKB thông minh:</strong>
                    <p className="mt-0.5 text-xs text-amber-800">
                      Bạn chỉ cần sao chép toàn bộ nội dung Thời khóa biểu từ file Word, Excel, hoặc văn bản phân công giảng dạy của nhà trường rồi dán vào bên dưới. AI Gemini sẽ tự động nhận diện Thứ 2 - Thứ 6, Buổi, Tiết, Lớp và Môn!
                    </p>
                  </div>
                </div>
              </div>

              {parseError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {parseSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{parseSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Văn bản Thời khóa biểu của bạn
                </label>
                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Ví dụ dán văn bản như sau:
Thứ 2:
- Tiết 1, 2: Toán 9A1 (P.201)
- Tiết 3: Toán 9A2 (P.202)
- Chiều Tiết 1, 2: Tin học 8B1

Thứ 3:
- Tiết 1, 2: Toán 9A2
- Tiết 4: Toán 9A1

Thứ 4:
- Tiết 2: Toán 9A1
- Tiết 3: Toán 9A2
- Chiều Tiết 2, 3: Tin học 8B2

Thứ 5:
- Tiết 1: Toán 9A1
- Tiết 3: Toán 9A2

Thứ 6:
- Tiết 2: Toán 9A2
- Tiết 3: Toán 9A1
- Chiều Tiết 1: Tin học 8B1`}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setRawText(`THỜI KHÓA BIỂU GIÁO VIÊN NĂM HỌC 2025-2026:
Thứ 2: Sáng T1 (9A1 Toán), T2 (9A1 Toán), T3 (9A2 Toán). Chiều T1 (8B1 Tin học), T2 (8B1 Tin học)
Thứ 3: Sáng T1 (9A2 Toán), T2 (9A2 Toán), T4 (9A1 Toán)
Thứ 4: Sáng T2 (9A1 Toán), T3 (9A2 Toán). Chiều T2 (8B2 Tin học), T3 (8B2 Tin học)
Thứ 5: Sáng T1 (9A1 Toán), T3 (9A2 Toán)
Thứ 6: Sáng T2 (9A2 Toán), T3 (9A1 Toán). Chiều T1 (8B1 Tin học)`)
                  }
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Dán mẫu ví dụ
                </button>

                <button
                  type="button"
                  disabled={isParsing}
                  onClick={handleAIParse}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-md transition"
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      AI đang phân tích tài liệu...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Trích xuất TKB bằng AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-xs text-slate-500">
            Click vào ô trống trên bảng để thêm tiết dạy, hoặc click vào tiết đã có để chỉnh sửa/xóa.
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleApplyAll}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Áp dụng Thời Khóa Biểu
            </button>
          </div>
        </div>
      </div>

      {/* Edit Single Slot Modal Dialog */}
      {selectedSlot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-slate-800 mb-3">
              {selectedSlot.existing ? "Chỉnh sửa tiết dạy" : "Thêm tiết dạy mới"}
            </h4>
            <div className="rounded-lg bg-slate-100 p-2 text-xs text-slate-600 mb-3">
              Thứ {selectedSlot.day} • {selectedSlot.session === "morning" ? "Buổi Sáng" : "Buổi Chiều"} • Tiết {selectedSlot.period}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Lớp dạy (ví dụ: Ba 1, Bốn 1, Năm 3, Hai 3, QLPM...)
                </label>
                <input
                  type="text"
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Ba 1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Môn học (ví dụ: Tin học, Công nghệ, Quản lý phòng máy...)
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Tin học"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phòng học (tùy chọn)
                </label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Phòng máy"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              {selectedSlot.existing ? (
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa tiết
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
