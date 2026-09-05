import React, { useState, useEffect, useMemo } from "react";
import {
  HolidayEntry,
  ScheduleEntry,
  ScheduleTemplateConfig,
  SubjectCurriculum,
  TeacherProfile,
  TimetableSlot,
} from "./types";
import {
  initialCurriculums,
  initialHolidays,
  initialTeacherProfile,
  initialTimetable,
} from "./data/defaultData";
import { calculateWeekDates, detectCurrentWeek } from "./utils/dateUtils";
import { generateWeeklySchedule } from "./utils/scheduleGenerator";
import { DEFAULT_TEMPLATE } from "./utils/templateParser";
import { Header } from "./components/Header";
import { WeekNavigator } from "./components/WeekNavigator";
import { ScheduleTable } from "./components/ScheduleTable";
import { TimetableEditorModal } from "./components/TimetableEditorModal";
import { CurriculumManagerModal } from "./components/CurriculumManagerModal";
import { TeacherProfileModal } from "./components/TeacherProfileModal";
import { AIAssistantDrawer } from "./components/AIAssistantDrawer";
import { ScheduleTemplateModal } from "./components/ScheduleTemplateModal";
import { CheckCircle, AlertCircle, Info, RotateCcw, UploadCloud, CalendarRange, FileSpreadsheet } from "lucide-react";

const CURRENT_DATA_VERSION = "2026_thoan_v35_full_curriculum";

function loadInitialState() {
  const version = localStorage.getItem("lbg_data_version");
  const storedTimetable = localStorage.getItem("lbg_timetable");
  const storedCurrs = localStorage.getItem("lbg_curriculums");

  let needReset = version !== CURRENT_DATA_VERSION;
  if (!needReset && storedTimetable) {
    try {
      const parsed = JSON.parse(storedTimetable);
      if (!Array.isArray(parsed) || parsed.length !== 22) {
        needReset = true;
      } else {
        const hasThoanClasses = parsed.some(
          (s: any) => s.className === "Ba 1" || s.className === "Năm 3"
        );
        if (!hasThoanClasses) needReset = true;
      }
    } catch {
      needReset = true;
    }
  } else {
    needReset = true;
  }

  // Ensure curriculums have all 35 weeks
  if (!needReset && storedCurrs) {
    try {
      const parsedCurrs = JSON.parse(storedCurrs);
      if (!Array.isArray(parsedCurrs) || parsedCurrs.length < 7 || parsedCurrs.some((c: any) => !c.lessons || c.lessons.length < 35)) {
        needReset = true;
      }
    } catch {
      needReset = true;
    }
  }

  if (needReset) {
    const savedTemplate = localStorage.getItem("lbg_template_config");
    localStorage.clear();
    if (savedTemplate) {
      localStorage.setItem("lbg_template_config", savedTemplate);
    }
    localStorage.setItem("lbg_data_version", CURRENT_DATA_VERSION);
    localStorage.setItem("lbg_version", CURRENT_DATA_VERSION);
    localStorage.setItem("lbg_profile", JSON.stringify(initialTeacherProfile));
    localStorage.setItem("lbg_timetable", JSON.stringify(initialTimetable));
    localStorage.setItem("lbg_curriculums", JSON.stringify(initialCurriculums));
    localStorage.setItem("lbg_holidays", JSON.stringify(initialHolidays));
    localStorage.removeItem("lbg_overrides");
    return {
      profile: initialTeacherProfile,
      timetable: initialTimetable,
      curriculums: initialCurriculums,
      holidays: initialHolidays,
      customOverrides: {},
    };
  }

  try {
    const profile =
      JSON.parse(localStorage.getItem("lbg_profile") || "null") ||
      initialTeacherProfile;
    const timetable =
      JSON.parse(localStorage.getItem("lbg_timetable") || "null") ||
      initialTimetable;
    const curriculums =
      JSON.parse(localStorage.getItem("lbg_curriculums") || "null") ||
      initialCurriculums;
    const holidays =
      JSON.parse(localStorage.getItem("lbg_holidays") || "null") ||
      initialHolidays;
    const customOverrides =
      JSON.parse(localStorage.getItem("lbg_overrides") || "{}") || {};
    return { profile, timetable, curriculums, holidays, customOverrides };
  } catch {
    return {
      profile: initialTeacherProfile,
      timetable: initialTimetable,
      curriculums: initialCurriculums,
      holidays: initialHolidays,
      customOverrides: {},
    };
  }
}

const initialLoadedState = loadInitialState();

export default function App() {
  const [profile, setProfile] = useState<TeacherProfile>(initialLoadedState.profile);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(initialLoadedState.timetable);
  const [curriculums, setCurriculums] = useState<SubjectCurriculum[]>(initialLoadedState.curriculums);
  const [holidays, setHolidays] = useState<HolidayEntry[]>(initialLoadedState.holidays);
  const [customOverrides, setCustomOverrides] = useState<
    Record<string, Partial<ScheduleEntry>>
  >(initialLoadedState.customOverrides);

  // Current active week state (defaults to detected current week)
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    return detectCurrentWeek(profile.startDateSemester1, profile.totalWeeks);
  });

  // Modals state
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [curriculumTab, setCurriculumTab] = useState<"lessons" | "upload" | "ai-import">("lessons");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Teaching Schedule Template State
  const [scheduleTemplate, setScheduleTemplate] = useState<ScheduleTemplateConfig>(() => {
    try {
      const stored = localStorage.getItem("lbg_template_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.columns && parsed.documentTitle) return parsed;
      }
    } catch {}
    return {
      ...DEFAULT_TEMPLATE,
      schoolName: profile.schoolName || DEFAULT_TEMPLATE.schoolName,
      departmentName: profile.department || DEFAULT_TEMPLATE.departmentName,
    };
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateModalTab, setTemplateModalTab] = useState<"upload" | "export_combined">("upload");

  const handleOpenTemplateModal = (tab: "upload" | "export_combined" = "upload") => {
    setTemplateModalTab(tab);
    setIsTemplateModalOpen(true);
  };

  const handleOpenCurriculum = (tab: "lessons" | "upload" | "ai-import" = "lessons") => {
    setCurriculumTab(tab);
    setIsCurriculumOpen(true);
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("lbg_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("lbg_template_config", JSON.stringify(scheduleTemplate));
  }, [scheduleTemplate]);

  useEffect(() => {
    localStorage.setItem("lbg_timetable", JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem("lbg_curriculums", JSON.stringify(curriculums));
  }, [curriculums]);

  useEffect(() => {
    localStorage.setItem("lbg_holidays", JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem("lbg_overrides", JSON.stringify(customOverrides));
  }, [customOverrides]);

  // Compute week dates info
  const weekInfo = useMemo(() => {
    return calculateWeekDates(profile.startDateSemester1, currentWeek);
  }, [profile.startDateSemester1, currentWeek]);

  // Generate weekly schedule automatically from TKB & PPCT
  const scheduleEntries = useMemo(() => {
    return generateWeeklySchedule({
      timetable,
      curriculums,
      startDateSemester1: profile.startDateSemester1,
      targetWeek: currentWeek,
      holidays,
      customOverrides,
    });
  }, [
    timetable,
    curriculums,
    profile.startDateSemester1,
    currentWeek,
    holidays,
    customOverrides,
  ]);

  // Handle entry update (inline editing)
  const handleUpdateEntry = (id: string, updates: Partial<ScheduleEntry>) => {
    setCustomOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
      },
    }));
  };

  // Reset custom override for an entry
  const handleResetEntry = (id: string) => {
    setCustomOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Quick toggle holiday for a specific date
  const handleQuickHolidayToggle = (isoDate: string, dayName: string) => {
    const existing = holidays.find((h) => h.date === isoDate);
    if (existing) {
      setHolidays(holidays.filter((h) => h.date !== isoDate));
    } else {
      const reason = prompt(`Nhập lý do nghỉ lễ cho ${dayName} (${isoDate}):`, "Nghỉ lễ theo quy định");
      if (reason !== null) {
        setHolidays([
          ...holidays,
          {
            id: `hol-${Date.now()}`,
            date: isoDate,
            name: reason || "Nghỉ lễ",
          },
        ]);
      }
    }
  };

  // Quick reset to official timetable of Thầy Thoàn
  const handleResetToStandardTimetable = () => {
    if (
      confirm(
        "Khôi phục lại Thời khóa biểu chính thức của Thầy Thoàn (22 tiết/tuần)? Toàn bộ dữ liệu TKB và PPCT sẽ được đặt lại về bản chuẩn."
      )
    ) {
      localStorage.clear();
      localStorage.setItem("lbg_data_version", CURRENT_DATA_VERSION);
      localStorage.setItem("lbg_version", CURRENT_DATA_VERSION);
      localStorage.setItem("lbg_profile", JSON.stringify(initialTeacherProfile));
      localStorage.setItem("lbg_timetable", JSON.stringify(initialTimetable));
      localStorage.setItem("lbg_curriculums", JSON.stringify(initialCurriculums));
      localStorage.setItem("lbg_holidays", JSON.stringify(initialHolidays));
      localStorage.removeItem("lbg_overrides");
      setProfile({ ...initialTeacherProfile });
      setTimetable([...initialTimetable]);
      setCurriculums([...initialCurriculums]);
      setHolidays([...initialHolidays]);
      setCustomOverrides({});
      alert("Đã cập nhật Thời khóa biểu chuẩn 22 tiết của Thầy Thoàn thành công!");
    }
  };

  const totalWeeklyPeriods = scheduleEntries.filter((e) => !e.isHoliday).length;
  const totalCurriculumLessons = curriculums.reduce(
    (acc, curr) => acc + curr.lessons.length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Application Navigation */}
      <Header
        entries={scheduleEntries}
        weekInfo={weekInfo}
        profile={profile}
        activeTemplate={scheduleTemplate}
        onOpenTimetable={() => setIsTimetableOpen(true)}
        onOpenCurriculum={() => handleOpenCurriculum("lessons")}
        onOpenCurriculumUpload={() => handleOpenCurriculum("upload")}
        onOpenTemplateModal={handleOpenTemplateModal}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 space-y-4">
        {/* Quick Status Bar */}
        <div className="rounded-xl bg-white border border-slate-200/80 px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-700">
              Đang xem <span className="text-indigo-700 font-bold">Tuần {currentWeek}</span> ({weekInfo.rangeText})
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 font-medium">
              <strong className="text-indigo-700 font-bold">{timetable.length} tiết TKB/tuần</strong> (22 tiết chuẩn)
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              Mẫu: <strong className="text-indigo-800">{scheduleTemplate.name}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* NÚT ÚP FILE MẪU LỊCH BÁO GIẢNG */}
            <button
              id="btn-quick-upload-template"
              onClick={() => handleOpenTemplateModal("upload")}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
              title="Úp file mẫu lịch báo giảng (.xlsx, .docx) của trường"
            >
              <UploadCloud className="h-3.5 w-3.5 text-amber-700" />
              Úp File Mẫu LBG
            </button>

            {/* NÚT XUẤT LỊCH BÁO GIẢNG CHUNG */}
            <button
              id="btn-quick-export-combined"
              onClick={() => handleOpenTemplateModal("export_combined")}
              className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 hover:bg-teal-100 transition shadow-2xs"
              title="Xuất Lịch Báo Giảng Chung cả học kỳ theo mẫu đã nạp"
            >
              <CalendarRange className="h-3.5 w-3.5 text-teal-700" />
              Xuất Lịch Chung (Cả kỳ)
            </button>

            <button
              id="btn-quick-upload-ppct"
              onClick={() => handleOpenCurriculum("upload")}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
              title="Tải lên tệp Word, Excel, PDF Kế hoạch bài dạy / PPCT"
            >
              <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
              Tải PPCT
            </button>

            <button
              onClick={handleResetToStandardTimetable}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
              title="Khôi phục lại chính xác thời khóa biểu 22 tiết của Thầy Thoàn"
            >
              <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
              TKB Thầy Thoàn
            </button>
          </div>
        </div>

        {/* Week Navigator (Automatic Monday-Friday Date Calculation) */}
        <WeekNavigator
          currentWeek={currentWeek}
          totalWeeks={profile.totalWeeks}
          startDateSemester1={profile.startDateSemester1}
          onSelectWeek={setCurrentWeek}
          onQuickHolidayToggle={handleQuickHolidayToggle}
          holidaysList={holidays}
        />

        {/* Official Lịch Báo Giảng Table */}
        <ScheduleTable
          entries={scheduleEntries}
          weekInfo={weekInfo}
          profile={profile}
          activeTemplate={scheduleTemplate}
          onOpenTemplateModal={handleOpenTemplateModal}
          onSaveTemplate={setScheduleTemplate}
          onUpdateEntry={handleUpdateEntry}
          onResetEntry={handleResetEntry}
        />
      </main>

      {/* Modals */}
      <ScheduleTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        activeTemplate={scheduleTemplate}
        onSaveTemplate={setScheduleTemplate}
        currentWeekEntries={scheduleEntries}
        weekInfo={weekInfo}
        profile={profile}
        timetable={timetable}
        curriculums={curriculums}
        holidays={holidays}
        customOverrides={customOverrides}
        defaultTab={templateModalTab}
      />

      {/* Modals */}
      <TimetableEditorModal
        isOpen={isTimetableOpen}
        onClose={() => setIsTimetableOpen(false)}
        timetable={timetable}
        onSave={setTimetable}
      />

      <CurriculumManagerModal
        isOpen={isCurriculumOpen}
        onClose={() => setIsCurriculumOpen(false)}
        curriculums={curriculums}
        onSaveCurriculums={setCurriculums}
        defaultTab={curriculumTab}
      />

      <TeacherProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={setProfile}
      />

      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        entries={scheduleEntries}
        weekInfo={weekInfo}
        profile={profile}
      />
    </div>
  );
}
