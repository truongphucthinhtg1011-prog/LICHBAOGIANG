import React, { useState, useRef, useEffect } from "react";
import { LessonPlanItem, SubjectCurriculum } from "../types";
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Layers,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  Image as ImageIcon,
  File as FileGenericIcon,
  Check,
  ArrowRight,
  Download,
} from "lucide-react";
import { initialCurriculums } from "../data/defaultData";
import { parseUploadedPpctFile, FileParseResult } from "../utils/fileParser";
import { BatchCurriculumUpload } from "./BatchCurriculumUpload";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  curriculums: SubjectCurriculum[];
  onSaveCurriculums: (curriculums: SubjectCurriculum[]) => void;
  defaultTab?: "lessons" | "upload" | "ai-import";
}

export const CurriculumManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  curriculums,
  onSaveCurriculums,
  defaultTab = "lessons",
}) => {
  const [list, setList] = useState<SubjectCurriculum[]>([...curriculums]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    curriculums[0]?.id || ""
  );

  const [activeTab, setActiveTab] = useState<"lessons" | "upload" | "ai-import">(
    defaultTab
  );

  // Sync props when opening
  useEffect(() => {
    if (isOpen) {
      setList([...curriculums]);
      if (curriculums.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(curriculums[0].id);
      }
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
    }
  }, [isOpen, defaultTab]);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileParseResult, setFileParseResult] = useState<FileParseResult | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [targetSubjectMode, setTargetSubjectMode] = useState<"existing" | "new">("existing");
  const [targetSubjectId, setTargetSubjectId] = useState<string>(
    curriculums[0]?.id || ""
  );

  // AI Import form state
  const [rawText, setRawText] = useState("");
  const [importSubjectName, setImportSubjectName] = useState("Tin học");
  const [importGrade, setImportGrade] = useState("3");
  const [importClasses, setImportClasses] = useState("Ba 1, Ba 2");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);

  // Editing single lesson state
  const [editingLesson, setEditingLesson] = useState<{
    subjectId: string;
    item: LessonPlanItem;
    isNew?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const currentSubject =
    list.find((s) => s.id === selectedSubjectId) || list[0];

  // Handle file selection (manual click or drop)
  const processSelectedFile = async (file: File) => {
    setIsReadingFile(true);
    setParseError(null);
    setParseSuccess(null);
    setUploadedFile(file);

    try {
      const result = await parseUploadedPpctFile(file);
      setFileParseResult(result);

      // Auto set subject & grade suggestions if detected
      if (result.detectedSubject) {
        setImportSubjectName(result.detectedSubject);
      }
      if (result.detectedGrade) {
        setImportGrade(result.detectedGrade);
      }

      // If an existing subject in our list matches the detected subject & grade, select it
      const matchedSubject = list.find((s) => {
        const nameMatch =
          result.detectedSubject &&
          s.subjectName.toLowerCase().includes(result.detectedSubject.toLowerCase());
        const gradeMatch =
          result.detectedGrade && String(s.grade) === String(result.detectedGrade);
        return nameMatch && gradeMatch;
      });

      if (matchedSubject) {
        setTargetSubjectId(matchedSubject.id);
        setTargetSubjectMode("existing");
      } else if (currentSubject) {
        setTargetSubjectId(currentSubject.id);
      }

      if (result.extractedText) {
        setRawText(result.extractedText);
      }
    } catch (err: any) {
      console.error("File read error:", err);
      setParseError(err.message || "Không thể đọc tệp này. Vui lòng thử lại.");
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // 1-Click apply structured lessons detected directly from Excel
  const handleApplyStructuredLessons = (lessons: LessonPlanItem[]) => {
    if (!lessons || lessons.length === 0) return;

    let updatedList = [...list];
    let appliedSubjectTitle = "";

    if (targetSubjectMode === "existing" && targetSubjectId) {
      const idx = updatedList.findIndex((s) => s.id === targetSubjectId);
      if (idx !== -1) {
        updatedList[idx] = {
          ...updatedList[idx],
          lessons: lessons,
        };
        appliedSubjectTitle = `${updatedList[idx].subjectName} Khối ${updatedList[idx].grade}`;
        setSelectedSubjectId(targetSubjectId);
      }
    } else {
      // Create new subject
      const newId = `curr-${Date.now()}`;
      const assignedArr = importClasses
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const newSubject: SubjectCurriculum = {
        id: newId,
        subjectName: importSubjectName.trim() || "Môn mới",
        grade: importGrade.trim() || "1",
        assignedClasses: assignedArr,
        lessons: lessons,
      };
      updatedList.push(newSubject);
      appliedSubjectTitle = `${newSubject.subjectName} Khối ${newSubject.grade}`;
      setSelectedSubjectId(newId);
    }

    setList(updatedList);
    onSaveCurriculums(updatedList);
    setParseSuccess(
      `Đã tải lên và nạp thành công ${lessons.length} tiết bài dạy vào môn ${appliedSubjectTitle}!`
    );
    setActiveTab("lessons");
  };

  // AI Parse PPCT handler (via text or base64 file)
  const handleAIParse = async () => {
    const textToSend = rawText.trim();
    const hasBase64 = Boolean(fileParseResult?.base64Data);

    if (!textToSend && !hasBase64) {
      setParseError("Vui lòng tải lên tệp PPCT hoặc dán nội dung văn bản để trích xuất.");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseSuccess(null);

    try {
      const response = await fetch("/api/gemini/parse-ppct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: textToSend,
          fileBase64: fileParseResult?.base64Data,
          mimeType: fileParseResult?.mimeType,
          fileName: uploadedFile?.name,
          subject: importSubjectName,
          grade: importGrade,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể phân tích tài liệu PPCT.");
      }

      const parsedItems: LessonPlanItem[] = (data.items || []).map(
        (it: any, index: number) => ({
          id: `ppct-${Date.now()}-${index}`,
          periodNumber: Number(it.periodNumber) || index + 1,
          lessonTitle: String(it.lessonTitle || "Bài học"),
          unitOrTopic: it.unitOrTopic ? String(it.unitOrTopic) : undefined,
          equipment: it.equipment ? String(it.equipment) : undefined,
          notes: it.notes ? String(it.notes) : undefined,
        })
      );

      if (parsedItems.length === 0) {
        setParseError("Không tìm thấy bài học nào. Vui lòng kiểm tra lại văn bản hoặc tệp đầu vào.");
      } else {
        handleApplyStructuredLessons(parsedItems);
      }
    } catch (err: any) {
      setParseError(err.message || "Lỗi xử lý tài liệu");
    } finally {
      setIsParsing(false);
    }
  };

  // Save single lesson edit
  const handleSaveLessonItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    setList((prev) =>
      prev.map((subj) => {
        if (subj.id !== editingLesson.subjectId) return subj;
        let lessons = [...subj.lessons];
        if (editingLesson.isNew) {
          lessons.push(editingLesson.item);
          lessons.sort((a, b) => a.periodNumber - b.periodNumber);
        } else {
          lessons = lessons.map((it) =>
            it.id === editingLesson.item.id ? editingLesson.item : it
          );
        }
        return { ...subj, lessons };
      })
    );
    setEditingLesson(null);
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!currentSubject) return;
    setList((prev) =>
      prev.map((subj) => {
        if (subj.id !== currentSubject.id) return subj;
        return {
          ...subj,
          lessons: subj.lessons.filter((it) => it.id !== lessonId),
        };
      })
    );
  };

  // Add new subject manually
  const handleAddNewSubject = () => {
    const name = prompt("Nhập tên môn học mới (ví dụ: Tin học, Công nghệ, Tiếng Việt...):");
    if (!name || !name.trim()) return;
    const grade = prompt("Khối lớp (ví dụ: 1, 2, 3, 4, 5):", "3") || "3";
    const classes = prompt("Các lớp áp dụng (phân cách dấu phẩy, ví dụ: Ba 1, Ba 2):", "Ba 1") || "";

    const newSubj: SubjectCurriculum = {
      id: `subj-${Date.now()}`,
      subjectName: name.trim(),
      grade: grade.trim(),
      assignedClasses: classes.split(",").map((c) => c.trim()).filter(Boolean),
      lessons: [
        {
          id: `p-${Date.now()}-1`,
          periodNumber: 1,
          lessonTitle: "Bài mở đầu",
          unitOrTopic: "Chủ đề A",
          equipment: "Máy tính, máy chiếu",
          notes: "",
        },
      ],
    };

    setList([...list, newSubj]);
    setSelectedSubjectId(newSubj.id);
  };

  const handleSaveAll = () => {
    onSaveCurriculums(list);
    onClose();
  };

  const handleLoadSample = () => {
    if (confirm("Khôi phục danh sách Phân phối chương trình gốc của Thầy Thoàn (Tin học 2, 3, 4, 5 & Công nghệ 4, 5)?")) {
      setList([...initialCurriculums]);
      setSelectedSubjectId(initialCurriculums[0].id);
      onSaveCurriculums([...initialCurriculums]);
    }
  };

  // Helper for file type icon
  const renderFileTypeIcon = (type?: string) => {
    switch (type) {
      case "excel":
        return <FileSpreadsheet className="h-6 w-6 text-emerald-600" />;
      case "word":
        return <FileText className="h-6 w-6 text-blue-600" />;
      case "pdf":
        return <FileCode className="h-6 w-6 text-rose-600" />;
      case "image":
        return <ImageIcon className="h-6 w-6 text-purple-600" />;
      default:
        return <FileGenericIcon className="h-6 w-6 text-slate-600" />;
    }
  };

  return (
    <div
      id="curriculum-manager-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print"
    >
      <div
        id="curriculum-manager-modal"
        className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Kế Hoạch Bài Dạy & Phân Phối Chương Trình (PPCT)
              </h3>
              <p className="text-xs text-slate-500">
                Tự động gán số tiết, tên bài dạy và thiết bị dạy học (ĐDDH) vào Lịch báo giảng hàng tuần.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-ppct-load-sample"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              title="Khôi phục PPCT mẫu chuẩn"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              PPCT gốc Thầy Thoàn
            </button>
            <button
              id="btn-ppct-modal-close"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Top bar: Subject selector & Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-2 gap-3">
          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Môn:
            </span>
            {list.map((subj) => {
              const isSelected = subj.id === currentSubject?.id;
              return (
                <button
                  key={subj.id}
                  id={`pill-subject-${subj.id}`}
                  onClick={() => {
                    setSelectedSubjectId(subj.id);
                    setTargetSubjectId(subj.id);
                    setActiveTab("lessons");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{subj.subjectName} {subj.grade && `K.${subj.grade}`}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-emerald-700 text-emerald-100" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {subj.lessons.length} tiết
                  </span>
                </button>
              );
            })}
            <button
              id="btn-add-new-subject"
              onClick={handleAddNewSubject}
              className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm môn
            </button>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
            <button
              id="tab-lessons-list"
              onClick={() => setActiveTab("lessons")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "lessons"
                  ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              Danh sách bài dạy ({currentSubject?.lessons?.length || 0})
            </button>

            <button
              id="tab-upload-file"
              onClick={() => {
                if (currentSubject) {
                  setImportSubjectName(currentSubject.subjectName);
                  setImportGrade(currentSubject.grade || "3");
                  setImportClasses(currentSubject.assignedClasses.join(", "));
                  setTargetSubjectId(currentSubject.id);
                }
                setActiveTab("upload");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-100/60"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Tải lên nhiều tệp PPCT</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                activeTab === "upload" ? "bg-emerald-700 text-emerald-100" : "bg-emerald-100 text-emerald-800"
              }`}>
                Hàng loạt
              </span>
            </button>

            <button
              id="tab-ai-import"
              onClick={() => {
                if (currentSubject) {
                  setImportSubjectName(currentSubject.subjectName);
                  setImportGrade(currentSubject.grade || "3");
                  setImportClasses(currentSubject.assignedClasses.join(", "));
                }
                setActiveTab("ai-import");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "ai-import"
                  ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Dán văn bản
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Danh sách bài dạy */}
          {activeTab === "lessons" && currentSubject && (
            <div className="space-y-4">
              {parseSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{parseSuccess}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Phân phối chương trình: {currentSubject.subjectName} — Khối {currentSubject.grade}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Áp dụng cho các lớp:{" "}
                    <span className="font-semibold text-emerald-700">
                      {currentSubject.assignedClasses.join(", ") || "Chưa gán lớp cụ thể"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-switch-to-upload"
                    onClick={() => setActiveTab("upload")}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Tải lên file cho môn này
                  </button>
                  <button
                    id="btn-add-lesson-period"
                    onClick={() => {
                      const nextNum =
                        (currentSubject.lessons.length > 0
                          ? Math.max(...currentSubject.lessons.map((l) => l.periodNumber))
                          : 0) + 1;
                      setEditingLesson({
                        subjectId: currentSubject.id,
                        isNew: true,
                        item: {
                          id: `p-${Date.now()}`,
                          periodNumber: nextNum,
                          lessonTitle: "",
                          unitOrTopic: "",
                          equipment: "",
                          notes: "",
                        },
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm tiết bài dạy
                  </button>
                </div>
              </div>

              {/* Lessons Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="w-16 py-3 px-3 text-center border-r border-slate-200">Tiết PPCT</th>
                      <th className="py-3 px-4 border-r border-slate-200">Tên bài dạy / Nội dung bài học</th>
                      <th className="py-3 px-3 border-r border-slate-200">Chủ đề / Mạch nội dung</th>
                      <th className="py-3 px-3 border-r border-slate-200">ĐDDH / Thiết bị dạy học</th>
                      <th className="py-3 px-3 border-r border-slate-200">Ghi chú</th>
                      <th className="w-20 py-3 px-2 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentSubject.lessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-800 bg-emerald-50/40 border-r border-slate-200">
                          {lesson.periodNumber}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-slate-200">
                          {lesson.lessonTitle}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                          {lesson.unitOrTopic || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                          {lesson.equipment || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 border-r border-slate-200">
                          {lesson.notes || ""}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-edit-lesson-${lesson.id}`}
                              onClick={() =>
                                setEditingLesson({
                                  subjectId: currentSubject.id,
                                  isNew: false,
                                  item: { ...lesson },
                                })
                              }
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-indigo-600"
                              title="Sửa bài dạy này"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`btn-delete-lesson-${lesson.id}`}
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Xóa bài dạy này"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentSubject.lessons.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          Chưa có bài dạy nào cho môn này.
                          <div className="mt-2">
                            <button
                              onClick={() => setActiveTab("upload")}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                            >
                              <UploadCloud className="h-3.5 w-3.5" />
                              Bấm vào đây để tải lên tệp PPCT Word / Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TẢI LÊN NHIỀU TỆP PPCT (HÀNG LOẠT) */}
          {activeTab === "upload" && (
            <div className="max-w-5xl mx-auto">
              <BatchCurriculumUpload
                curriculums={list}
                onApplyBatch={(updatedList, summaryMessage) => {
                  setList(updatedList);
                  onSaveCurriculums(updatedList);
                  setParseSuccess(summaryMessage);
                  setActiveTab("lessons");
                }}
                onSwitchToLessons={(subjectId) => {
                  if (subjectId) setSelectedSubjectId(subjectId);
                  setActiveTab("lessons");
                }}
                initialSubjectId={currentSubject?.id}
              />
            </div>
          )}

          {/* TAB 3: DÁN VĂN BẢN TRỰC TIẾP */}
          {activeTab === "ai-import" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="rounded-xl bg-emerald-50/80 p-4 border border-emerald-200 text-emerald-900 text-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Dán nội dung Kế hoạch bài dạy / PPCT:</strong>
                    <p className="mt-0.5 text-xs text-emerald-800">
                      Sao chép văn bản PPCT môn học từ bất kỳ tài liệu nào và dán vào khung bên dưới. AI sẽ tự động chia thành danh sách tiết 1, tiết 2... kèm tên bài và đồ dùng dạy học.
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên môn học
                  </label>
                  <input
                    type="text"
                    value={importSubjectName}
                    onChange={(e) => setImportSubjectName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-hidden"
                    placeholder="Tin học"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <input
                    type="text"
                    value={importGrade}
                    onChange={(e) => setImportGrade(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-hidden"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Các lớp áp dụng
                  </label>
                  <input
                    type="text"
                    value={importClasses}
                    onChange={(e) => setImportClasses(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-hidden uppercase"
                    placeholder="Ba 1, Ba 2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Văn bản Kế hoạch bài dạy / Phân phối chương trình
                </label>
                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Dán văn bản phân phối chương trình vào đây. Ví dụ:
Tiết 1: Bài 1. Thông tin và quyết định - Thiết bị: Máy tính, máy chiếu
Tiết 2: Bài 2. Xử lý thông tin - Thiết bị: Tranh ảnh
Tiết 3: Bài 3. Máy tính - những người bạn mới - Thiết bị: Máy tính...`}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setRawText(`KẾ HOẠCH BÀI DẠY MÔN TIN HỌC KHỐI 3:
Tiết 1: Bài 1. Thông tin và quyết định (Tiết 1) - ĐDDH: Máy chiếu, phiếu bài tập
Tiết 2: Bài 1. Thông tin và quyết định (Tiết 2) - ĐDDH: Tranh minh họa
Tiết 3: Bài 2. Xử lý thông tin (Tiết 1) - ĐDDH: Máy tính
Tiết 4: Bài 2. Xử lý thông tin (Tiết 2) - ĐDDH: Phiếu thực hành
Tiết 5: Bài 3. Máy tính - những người bạn mới (Tiết 1) - ĐDDH: Máy tính mẫu
Tiết 6: Bài 3. Máy tính - những người bạn mới (Tiết 2) - ĐDDH: Máy tính học sinh
Tiết 7: Bài 4. Bàn phím máy tính (Tiết 1) - ĐDDH: Bàn phím mẫu
Tiết 8: Bài 4. Bàn phím máy tính (Tiết 2) - ĐDDH: Phần mềm luyện gõ phím`)
                  }
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Dán ví dụ PPCT Tin học 3
                </button>

                <button
                  type="button"
                  disabled={isParsing}
                  onClick={handleAIParse}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md transition"
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      AI đang xử lý PPCT...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Trích xuất PPCT bằng AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-xs text-slate-500">
            Lịch báo giảng sẽ tự động lấy bài từ danh sách này theo đúng thứ tự tiết dạy.
          </span>
          <div className="flex gap-3">
            <button
              id="btn-modal-cancel"
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              Đóng
            </button>
            <button
              id="btn-modal-save-all"
              type="button"
              onClick={handleSaveAll}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
            >
              Lưu & Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa 1 tiết */}
      {editingLesson && (
        <div
          id="modal-edit-single-lesson"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
        >
          <form
            onSubmit={handleSaveLessonItem}
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-800">
                {editingLesson.isNew ? "Thêm tiết bài dạy mới" : "Chỉnh sửa tiết bài dạy"}
              </h4>
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tiết theo PPCT (Số nguyên)
              </label>
              <input
                type="number"
                min={1}
                required
                value={editingLesson.item.periodNumber}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    item: {
                      ...editingLesson.item,
                      periodNumber: Number(e.target.value),
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên bài dạy / Bài học
              </label>
              <input
                type="text"
                required
                value={editingLesson.item.lessonTitle}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    item: {
                      ...editingLesson.item,
                      lessonTitle: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-hidden"
                placeholder="Ví dụ: Bài 1. Thông tin và quyết định"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Chủ đề / Chương
              </label>
              <input
                type="text"
                value={editingLesson.item.unitOrTopic || ""}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    item: {
                      ...editingLesson.item,
                      unitOrTopic: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-hidden"
                placeholder="Ví dụ: Chủ đề A. Máy tính và em"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Đồ dùng dạy học / Thiết bị (ĐDDH)
              </label>
              <input
                type="text"
                value={editingLesson.item.equipment || ""}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    item: {
                      ...editingLesson.item,
                      equipment: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-hidden"
                placeholder="Ví dụ: Máy tính, máy chiếu, phiếu thực hành"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ghi chú
              </label>
              <input
                type="text"
                value={editingLesson.item.notes || ""}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    item: {
                      ...editingLesson.item,
                      notes: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-hidden"
                placeholder="Ví dụ: Thực hành phòng máy"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
