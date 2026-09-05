import React from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Sparkles } from "lucide-react";
import { calculateWeekDates, detectCurrentWeek } from "../utils/dateUtils";
import { DayOfWeek } from "../types";

interface Props {
  currentWeek: number;
  totalWeeks: number;
  startDateSemester1: string;
  onSelectWeek: (week: number) => void;
  onQuickHolidayToggle?: (isoDate: string, dayName: string) => void;
  holidaysList?: { date: string; name: string }[];
}

export const WeekNavigator: React.FC<Props> = ({
  currentWeek,
  totalWeeks,
  startDateSemester1,
  onSelectWeek,
  onQuickHolidayToggle,
  holidaysList = [],
}) => {
  const weekInfo = calculateWeekDates(startDateSemester1, currentWeek);
  const detectedTodayWeek = detectCurrentWeek(startDateSemester1, totalWeeks);

  const handlePrev = () => {
    if (currentWeek > 1) {
      onSelectWeek(currentWeek - 1);
    }
  };

  const handleNext = () => {
    if (currentWeek < totalWeeks) {
      onSelectWeek(currentWeek + 1);
    }
  };

  const holidayMap = new Map<string, string>();
  holidaysList.forEach((h) => holidayMap.set(h.date, h.name));

  const daysList: DayOfWeek[] = [2, 3, 4, 5, 6];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm no-print">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Week Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentWeek <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Tuần trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative">
            <select
              value={currentWeek}
              onChange={(e) => onSelectWeek(Number(e.target.value))}
              className="appearance-none rounded-xl border border-indigo-200 bg-indigo-50/60 py-2 pl-4 pr-10 text-base font-bold text-indigo-900 focus:border-indigo-500 focus:outline-hidden cursor-pointer"
            >
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => {
                const info = calculateWeekDates(startDateSemester1, w);
                return (
                  <option key={w} value={w}>
                    Tuần {w} ({info.startDateStr} - {info.endDateStr})
                  </option>
                );
              })}
            </select>
            <Calendar className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-indigo-600" />
          </div>

          <button
            onClick={handleNext}
            disabled={currentWeek >= totalWeeks}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Tuần sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {currentWeek !== detectedTodayWeek && (
            <button
              onClick={() => onSelectWeek(detectedTodayWeek)}
              className="ml-2 flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              title={`Chuyển đến tuần hiện tại (${detectedTodayWeek})`}
            >
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              Tuần hiện tại (Tuần {detectedTodayWeek})
            </button>
          )}
        </div>

        {/* Center/Right: Date range banner */}
        <div className="flex flex-col items-center md:items-end">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <Sparkles className="h-3 w-3" /> Tự động tính ngày
            </span>
            <span className="text-sm font-bold text-slate-800">
              {weekInfo.rangeText}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-0.5">
            Giảng dạy từ Thứ Hai đến Thứ Sáu (5 ngày trong tuần)
          </span>
        </div>
      </div>

      {/* Day Pills Bar */}
      <div className="mt-3 grid grid-cols-5 gap-2 border-t border-slate-100 pt-3">
        {daysList.map((d) => {
          const dayData = weekInfo.days[d];
          const isHoliday = holidayMap.has(dayData.isoDate);
          const holidayReason = holidayMap.get(dayData.isoDate);

          return (
            <div
              key={d}
              className={`flex flex-col rounded-xl p-2 border transition text-center ${
                isHoliday
                  ? "bg-red-50/80 border-red-200 text-red-800"
                  : "bg-slate-50/70 border-slate-200/80 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{dayData.shortName}</span>
                {onQuickHolidayToggle && (
                  <button
                    onClick={() =>
                      onQuickHolidayToggle(dayData.isoDate, dayData.dayName)
                    }
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition ${
                      isHoliday
                        ? "bg-red-200 text-red-800 hover:bg-red-300"
                        : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    }`}
                    title={isHoliday ? "Hủy đánh dấu nghỉ lễ" : "Đánh dấu ngày nghỉ lễ"}
                  >
                    {isHoliday ? "Nghỉ" : "+ Nghỉ"}
                  </button>
                )}
              </div>
              <span className="text-[13px] font-semibold tracking-tight mt-0.5">
                {dayData.dateStr}
              </span>
              {isHoliday && (
                <span className="text-[10px] text-red-600 font-medium truncate mt-0.5">
                  {holidayReason || "Nghỉ lễ"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
