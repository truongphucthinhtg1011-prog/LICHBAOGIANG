import React, { useState, useRef } from "react";
import { LessonPlanItem, SubjectCurriculum } from "../types";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  Image as ImageIcon,
  File as FileGenericIcon,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Eye,
  Sparkles,
  Layers,
  Plus,
  Edit2,
  X,
  CheckCheck,
  Play,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { parseUploadedPpctFile, FileParseResult } from "../utils/fileParser";
import { initialCurriculums } from "../data/defaultData";

export interface BatchFileItem {
  id: string;
  file?: File;
  fileType: "excel" | "word" | "pdf" | "image" | "text" | "sample" | "unknown";
  fileName: string;
  fileSize: number;
  extractedText: string;
  base64Data?: string;
  mimeType?: string;
  detectedSubject?: string;
  detectedGrade?: string;

  // Target assignment
  targetMode: "existing" | "new";
  targetSubjectId: string;
  newSubjectName: string;
  newSubjectGrade: string;
  newSubjectClasses: string;

  // Lessons
  lessons: LessonPlanItem[];

  // Processing status
  status: "ready" | "need_ai" | "processing_ai" | "applied" | "error";
  errorMessage?: string;
}

interface Props {
  curriculums: SubjectCurriculum[];
  onApplyBatch: (updatedCurriculums: SubjectCurriculum[], summaryMessage: string) => void;
  onSwitchToLessons: (subjectId?: string) => void;
  initialSubjectId?: string;
}

export const BatchCurriculumUpload: React.FC<Props> = ({
  curriculums,
  onApplyBatch,
  onSwitchToLessons,
  initialSubjectId,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Modal previewing or editing lessons of a single file in batch
  const [previewingItem, setPreviewingItem] = useState<BatchFileItem | null>(null);

  // Helper to find best matching subject from existing curriculums
  const findBestMatchingSubject = (detectedSubject?: string, detectedGrade?: string) => {
    if (!detectedSubject && !detectedGrade) return null;

    // 1. Match both subject name and grade
    const exact = curriculums.find((s) => {
      const sName = s.subjectName.toLowerCase();
      const dName = (detectedSubject || "").toLowerCase();
      const nameMatch = dName ? sName.includes(dName) || dName.includes(sName) : true;
      const gradeMatch = detectedGrade ? String(s.grade) === String(detectedGrade) : true;
      return nameMatch && gradeMatch;
    });
    if (exact) return exact;

    // 2. Match grade only
    if (detectedGrade) {
      const gradeMatchOnly = curriculums.find(
        (s) => String(s.grade) === String(detectedGrade)
      );
      if (gradeMatchOnly) return gradeMatchOnly;
    }

    // 3. Match subject name only
    if (detectedSubject) {
      const nameMatchOnly = curriculums.find((s) =>
        s.subjectName.toLowerCase().includes(detectedSubject.toLowerCase())
      );
      if (nameMatchOnly) return nameMatchOnly;
    }

    return null;
  };

  // Process a list of selected or dropped files
  const handleProcessFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsReadingFiles(true);
    setNotification(null);

    const newItems: BatchFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await parseUploadedPpctFile(file);
        const matched = findBestMatchingSubject(
          result.detectedSubject,
          result.detectedGrade
        );

        let initialStatus: BatchFileItem["status"] = "need_ai";
        let initialLessons: LessonPlanItem[] = [];

        if (result.structuredLessons && result.structuredLessons.length > 0) {
          initialLessons = result.structuredLessons;
          initialStatus = "ready";
        } else if (!result.extractedText && !result.base64Data) {
          initialStatus = "error";
        }

        const item: BatchFileItem = {
          id: `file-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          file,
          fileType: result.fileType,
          fileName: file.name,
          fileSize: file.size,
          extractedText: result.extractedText || "",
          base64Data: result.base64Data,
          mimeType: result.mimeType,
          detectedSubject: result.detectedSubject,
          detectedGrade: result.detectedGrade,
          targetMode: matched ? "existing" : "new",
          targetSubjectId: matched ? matched.id : initialSubjectId || "",
          newSubjectName: result.detectedSubject || "Tin học",
          newSubjectGrade: result.detectedGrade || "3",
          newSubjectClasses: result.detectedGrade
            ? `Lớp ${result.detectedGrade}A1, Lớp ${result.detectedGrade}A2`
            : "Lớp 3A1",
          lessons: initialLessons,
          status: initialStatus,
          errorMessage:
            initialStatus === "error" ? "Không thể đọc nội dung tệp" : undefined,
        };

        newItems.push(item);
      } catch (err: any) {
        newItems.push({
          id: `file-err-${Date.now()}-${i}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: "unknown",
          extractedText: "",
          lessons: [],
          targetMode: "new",
          targetSubjectId: "",
          newSubjectName: "Môn mới",
          newSubjectGrade: "1",
          newSubjectClasses: "Lớp 1",
          status: "error",
          errorMessage: err.message || "Lỗi đọc tệp",
        });
      }
    }

    setBatchFiles((prev) => [...prev, ...newItems]);
    setIsReadingFiles(false);

    const readyCount = newItems.filter((it) => it.status === "ready").length;
    const needAiCount = newItems.filter((it) => it.status === "need_ai").length;

    setNotification({
      type: "info",
      message: `Đã nạp ${newItems.length} tệp. Trong đó: ${readyCount} tệp sẵn sàng ngay, ${needAiCount} tệp cần AI trích xuất.`,
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(Array.from(e.target.files));
      e.target.value = "";
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Process AI for a single item
  const handleProcessSingleItemAI = async (itemId: string) => {
    const item = batchFiles.find((f) => f.id === itemId);
    if (!item) return;

    setBatchFiles((prev) =>
      prev.map((f) => (f.id === itemId ? { ...f, status: "processing_ai" } : f))
    );

    try {
      const response = await fetch("/api/gemini/parse-ppct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: item.extractedText,
          fileBase64: item.base64Data,
          mimeType: item.mimeType,
          fileName: item.fileName,
          subject: item.targetMode === "existing"
            ? curriculums.find((c) => c.id === item.targetSubjectId)?.subjectName || item.newSubjectName
            : item.newSubjectName,
          grade: item.targetMode === "existing"
            ? curriculums.find((c) => c.id === item.targetSubjectId)?.grade || item.newSubjectGrade
            : item.newSubjectGrade,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể phân tích PPCT bằng AI.");
      }

      const parsedItems: LessonPlanItem[] = (data.items || []).map(
        (it: any, idx: number) => ({
          id: `ppct-${Date.now()}-${idx}`,
          periodNumber: Number(it.periodNumber) || idx + 1,
          lessonTitle: String(it.lessonTitle || "Bài học"),
          unitOrTopic: it.unitOrTopic ? String(it.unitOrTopic) : undefined,
          equipment: it.equipment ? String(it.equipment) : undefined,
          notes: it.notes ? String(it.notes) : undefined,
        })
      );

      if (parsedItems.length === 0) {
        throw new Error("AI không tìm thấy danh sách tiết bài dạy trong tệp này.");
      }

      setBatchFiles((prev) =>
        prev.map((f) =>
          f.id === itemId
            ? { ...f, lessons: parsedItems, status: "ready", errorMessage: undefined }
            : f
        )
      );

      setNotification({
        type: "success",
        message: `Trích xuất AI thành công cho tệp "${item.fileName}": Tìm thấy ${parsedItems.length} tiết bài dạy!`,
      });
    } catch (err: any) {
      setBatchFiles((prev) =>
        prev.map((f) =>
          f.id === itemId
            ? { ...f, status: "error", errorMessage: err.message || "Lỗi xử lý AI" }
            : f
        )
      );
    }
  };

  // Process all pending AI items in batch
  const handleProcessBatchAI = async () => {
    const pendingItems = batchFiles.filter(
      (it) => it.status === "need_ai" || it.status === "error" || it.lessons.length === 0
    );

    if (pendingItems.length === 0) {
      setNotification({
        type: "info",
        message: "Tất cả các tệp đều đã có bài dạy sẵn sàng!",
      });
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: pendingItems.length, currentFileName: "" });

    let successCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setBatchProgress({
        current: i + 1,
        total: pendingItems.length,
        currentFileName: item.fileName,
      });

      setBatchFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "processing_ai" } : f))
      );

      try {
        const response = await fetch("/api/gemini/parse-ppct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText: item.extractedText,
            fileBase64: item.base64Data,
            mimeType: item.mimeType,
            fileName: item.fileName,
            subject: item.targetMode === "existing"
              ? curriculums.find((c) => c.id === item.targetSubjectId)?.subjectName || item.newSubjectName
              : item.newSubjectName,
            grade: item.targetMode === "existing"
              ? curriculums.find((c) => c.id === item.targetSubjectId)?.grade || item.newSubjectGrade
              : item.newSubjectGrade,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Không thể phân tích PPCT bằng AI.");
        }

        const parsedItems: LessonPlanItem[] = (data.items || []).map(
          (it: any, idx: number) => ({
            id: `ppct-${Date.now()}-${idx}`,
            periodNumber: Number(it.periodNumber) || idx + 1,
            lessonTitle: String(it.lessonTitle || "Bài học"),
            unitOrTopic: it.unitOrTopic ? String(it.unitOrTopic) : undefined,
            equipment: it.equipment ? String(it.equipment) : undefined,
            notes: it.notes ? String(it.notes) : undefined,
          })
        );

        if (parsedItems.length === 0) {
          throw new Error("AI không tìm thấy danh sách tiết bài dạy trong tệp này.");
        }

        setBatchFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, lessons: parsedItems, status: "ready", errorMessage: undefined }
              : f
          )
        );
        successCount++;
      } catch (err: any) {
        setBatchFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error", errorMessage: err.message || "Lỗi xử lý AI" }
              : f
          )
        );
      }
    }

    setIsBatchProcessing(false);
    setBatchProgress(null);

    setNotification({
      type: "success",
      message: `Đã hoàn tất trích xuất AI: Thành công ${successCount}/${pendingItems.length} tệp!`,
    });
  };

  // 1-Click apply a single item
  const handleApplySingleItem = (item: BatchFileItem) => {
    if (!item.lessons || item.lessons.length === 0) {
      setNotification({
        type: "error",
        message: `Tệp "${item.fileName}" chưa có bài dạy để áp dụng.`,
      });
      return;
    }

    let updatedList = [...curriculums];
    let appliedTitle = "";

    if (item.targetMode === "existing" && item.targetSubjectId) {
      const idx = updatedList.findIndex((s) => s.id === item.targetSubjectId);
      if (idx !== -1) {
        updatedList[idx] = {
          ...updatedList[idx],
          lessons: item.lessons,
        };
        appliedTitle = `${updatedList[idx].subjectName} Khối ${updatedList[idx].grade}`;
      }
    } else {
      const newId = `curr-${Date.now()}`;
      const assignedArr = item.newSubjectClasses
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const newSubj: SubjectCurriculum = {
        id: newId,
        subjectName: item.newSubjectName.trim() || "Môn mới",
        grade: item.newSubjectGrade.trim() || "1",
        assignedClasses: assignedArr,
        lessons: item.lessons,
      };
      updatedList.push(newSubj);
      appliedTitle = `${newSubj.subjectName} Khối ${newSubj.grade}`;
    }

    setBatchFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: "applied" } : f))
    );

    onApplyBatch(
      updatedList,
      `Đã cập nhật thành công ${item.lessons.length} tiết bài dạy vào môn ${appliedTitle}!`
    );
  };

  // 1-Click apply ALL ready items in batch
  const handleApplyAllBatch = () => {
    const readyItems = batchFiles.filter(
      (item) => item.lessons.length > 0 && item.status !== "applied"
    );

    if (readyItems.length === 0) {
      setNotification({
        type: "error",
        message:
          "Chưa có tệp nào sẵn sàng bài dạy để áp dụng. Vui lòng kiểm tra hoặc trích xuất AI trước.",
      });
      return;
    }

    let updatedList = [...curriculums];
    let appliedCount = 0;
    let totalLessonsCount = 0;

    readyItems.forEach((item) => {
      if (item.targetMode === "existing" && item.targetSubjectId) {
        const idx = updatedList.findIndex((s) => s.id === item.targetSubjectId);
        if (idx !== -1) {
          updatedList[idx] = {
            ...updatedList[idx],
            lessons: item.lessons,
          };
          appliedCount++;
          totalLessonsCount += item.lessons.length;
        }
      } else {
        const newId = `curr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const assignedArr = (item.newSubjectClasses || "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        const newSubj: SubjectCurriculum = {
          id: newId,
          subjectName: item.newSubjectName.trim() || "Môn mới",
          grade: item.newSubjectGrade.trim() || "1",
          assignedClasses: assignedArr,
          lessons: item.lessons,
        };
        updatedList.push(newSubj);
        appliedCount++;
        totalLessonsCount += item.lessons.length;
      }
    });

    setBatchFiles((prev) =>
      prev.map((f) =>
        readyItems.some((r) => r.id === f.id) ? { ...f, status: "applied" } : f
      )
    );

    onApplyBatch(
      updatedList,
      `Đã áp dụng thành công toàn bộ ${appliedCount} tệp PPCT (${totalLessonsCount} bài dạy)! Lịch báo giảng các tuần đã tự động đồng bộ theo Thời khóa biểu.`
    );
  };

  // Load 4 sample files for instant testing
  const handleLoadSampleBatch = () => {
    const sampleItems: BatchFileItem[] = [
      {
        id: `sample-th3-${Date.now()}`,
        fileName: "PPCT_TinHoc_Lop3_GDPT2018.xlsx",
        fileSize: 42500,
        fileType: "excel",
        extractedText: "[Bảng tính Excel PPCT Tin học Khối 3 - 35 tiết]",
        detectedSubject: "Tin học",
        detectedGrade: "3",
        targetMode: "existing",
        targetSubjectId: curriculums.find((c) => c.subjectName.includes("Tin") && c.grade === "3")?.id || curriculums[0]?.id || "",
        newSubjectName: "Tin học",
        newSubjectGrade: "3",
        newSubjectClasses: "Ba 1, Ba 2",
        lessons: initialCurriculums.find((c) => c.grade === "3")?.lessons || [],
        status: "ready",
      },
      {
        id: `sample-th4-${Date.now()}`,
        fileName: "PPCT_TinHoc_Lop4_CanhDieu.docx",
        fileSize: 38200,
        fileType: "word",
        extractedText: "[Văn bản Word PPCT Tin học Khối 4 - 35 tiết]",
        detectedSubject: "Tin học",
        detectedGrade: "4",
        targetMode: "existing",
        targetSubjectId: curriculums.find((c) => c.subjectName.includes("Tin") && c.grade === "4")?.id || curriculums[0]?.id || "",
        newSubjectName: "Tin học",
        newSubjectGrade: "4",
        newSubjectClasses: "Bốn 1, Bốn 2, Bốn 3",
        lessons: initialCurriculums.find((c) => c.grade === "4")?.lessons || [],
        status: "ready",
      },
      {
        id: `sample-cn4-${Date.now()}`,
        fileName: "PPCT_CongNghe_Lop4_KetNoi.xlsx",
        fileSize: 45100,
        fileType: "excel",
        extractedText: "[Bảng tính Excel PPCT Công nghệ Khối 4 - 35 tiết]",
        detectedSubject: "Công nghệ",
        detectedGrade: "4",
        targetMode: "existing",
        targetSubjectId: curriculums.find((c) => c.subjectName.includes("Công nghệ") && c.grade === "4")?.id || curriculums[0]?.id || "",
        newSubjectName: "Công nghệ",
        newSubjectGrade: "4",
        newSubjectClasses: "Bốn 1, Bốn 2, Bốn 3",
        lessons: initialCurriculums.find((c) => c.subjectName.includes("Công nghệ") && c.grade === "4")?.lessons || [],
        status: "ready",
      },
      {
        id: `sample-cn5-${Date.now()}`,
        fileName: "PPCT_CongNghe_Lop5_ChanTroi.docx",
        fileSize: 39800,
        fileType: "word",
        extractedText: "[Văn bản Word PPCT Công nghệ Khối 5 - 35 tiết]",
        detectedSubject: "Công nghệ",
        detectedGrade: "5",
        targetMode: "existing",
        targetSubjectId: curriculums.find((c) => c.subjectName.includes("Công nghệ") && c.grade === "5")?.id || curriculums[0]?.id || "",
        newSubjectName: "Công nghệ",
        newSubjectGrade: "5",
        newSubjectClasses: "Năm 1, Năm 2",
        lessons: initialCurriculums.find((c) => c.subjectName.includes("Công nghệ") && c.grade === "5")?.lessons || [],
        status: "ready",
      },
    ];

    setBatchFiles((prev) => [...prev, ...sampleItems]);
    setNotification({
      type: "success",
      message: "Đã nạp 4 tệp PPCT mẫu chuẩn GDPT 2018 (Tin học 3, 4 & Công nghệ 4, 5). Thầy/cô có thể bấm 'Áp dụng TẤT CẢ' ngay!",
    });
  };

  const renderFileTypeIcon = (type?: string) => {
    switch (type) {
      case "excel":
        return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
      case "word":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "pdf":
        return <FileCode className="h-5 w-5 text-rose-600" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <FileGenericIcon className="h-5 w-5 text-slate-500" />;
    }
  };

  const totalFiles = batchFiles.length;
  const readyFiles = batchFiles.filter((f) => f.status === "ready" || f.status === "applied").length;
  const pendingAiFiles = batchFiles.filter((f) => f.status === "need_ai").length;
  const appliedFiles = batchFiles.filter((f) => f.status === "applied").length;
  const totalLessonsExtracted = batchFiles.reduce((sum, f) => sum + f.lessons.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 p-5 border border-emerald-200/90 text-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                Tải lên Hàng Loạt Tệp Phân Phối Chương Trình (PPCT)
                <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-900">
                  Nhiều tệp cùng lúc
                </span>
              </h4>
              <p className="text-xs text-emerald-900 leading-relaxed max-w-2xl">
                Thầy/cô có thể chọn hoặc kéo thả <strong>nhiều tệp một lúc</strong> (Excel, Word, PDF, Ảnh). Hệ thống tự động nhận diện tên môn, khối lớp và trích xuất danh sách bài dạy để đồng bộ vào Lịch báo giảng.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-load-sample-batch"
            onClick={handleLoadSampleBatch}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100/70 transition shadow-2xs"
            title="Tải nhanh 4 tệp PPCT mẫu để thử nghiệm ngay"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Nạp 4 tệp mẫu thử nghiệm
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl p-3.5 text-xs border animate-in fade-in duration-150 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : notification.type === "error"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : notification.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <Layers className="h-4 w-4 shrink-0 text-blue-600" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Hidden Native File Input with multiple attribute */}
      <input
        ref={fileInputRef}
        type="file"
        id="ppct-multi-file-input"
        multiple
        accept=".xlsx,.xls,.csv,.docx,.txt,.pdf,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Multi-file Area */}
      <div
        id="ppct-multi-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/90 scale-[1.01] shadow-md"
            : "border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/40"
        }`}
      >
        {isReadingFiles ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold text-slate-800">
              Đang phân tích các tệp đã tải lên...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Kéo & thả <span className="text-emerald-700 underline">một hoặc NHIỀU tệp PPCT</span> vào đây
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hoặc bấm vào khung để chọn nhiều tệp cùng lúc từ máy tính
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <span className="rounded-full bg-emerald-100/70 px-3 py-1 text-[11px] font-semibold text-emerald-900 border border-emerald-200">
                Excel (.xlsx, .xls): Đọc bảng bài dạy tự động
              </span>
              <span className="rounded-full bg-blue-100/70 px-3 py-1 text-[11px] font-semibold text-blue-900 border border-blue-200">
                Word (.docx): Trích xuất phân phối
              </span>
              <span className="rounded-full bg-rose-100/70 px-3 py-1 text-[11px] font-semibold text-rose-900 border border-rose-200">
                PDF & Ảnh: Quét chuẩn bằng AI
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Batch Processing Progress Bar (when AI runs on multiple files) */}
      {isBatchProcessing && batchProgress && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 space-y-2 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
              Đang phân tích AI: {batchProgress.currentFileName}
            </span>
            <span>
              {batchProgress.current} / {batchProgress.total} tệp (
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-indigo-200 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Batch Files Queue Section */}
      {totalFiles > 0 && (
        <div className="space-y-4">
          {/* Summary stats & Batch Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Hàng đợi:</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200">
                  {totalFiles} tệp
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="h-3.5 w-3.5" />
                <span>{readyFiles} sẵn sàng ({totalLessonsExtracted} bài dạy)</span>
              </div>
              {pendingAiFiles > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{pendingAiFiles} tệp cần AI đọc</span>
                </div>
              )}
              {appliedFiles > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>{appliedFiles} đã áp dụng</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-add-more-files"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                Thêm tệp khác...
              </button>

              {pendingAiFiles > 0 && (
                <button
                  type="button"
                  id="btn-run-all-ai"
                  disabled={isBatchProcessing}
                  onClick={handleProcessBatchAI}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Trích xuất tất cả bằng AI ({pendingAiFiles})
                </button>
              )}

              <button
                type="button"
                id="btn-apply-all-batch-ppct"
                disabled={isBatchProcessing || readyFiles === 0}
                onClick={handleApplyAllBatch}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                <CheckCheck className="h-4 w-4" />
                Áp dụng TẤT CẢ vào Lịch báo giảng
              </button>

              <button
                type="button"
                id="btn-clear-all-batch-files"
                onClick={() => {
                  if (confirm("Xóa toàn bộ danh sách tệp đã nạp trong hàng đợi này?")) {
                    setBatchFiles([]);
                  }
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                title="Xóa danh sách tệp"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table of Batch Items */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tệp PPCT</th>
                    <th className="py-3 px-3">Môn & Khối nhận diện</th>
                    <th className="py-3 px-3">Môn áp dụng trong hệ thống</th>
                    <th className="py-3 px-3 text-center">Trạng thái & Bài dạy</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {batchFiles.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      {/* File Name & Format */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                            {renderFileTypeIcon(item.fileType)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 truncate max-w-xs" title={item.fileName}>
                              {item.fileName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {(item.fileSize / 1024).toFixed(1)} KB • {item.fileType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Auto-detected Subject & Grade */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
                            {item.detectedSubject || "Chưa rõ"}
                          </span>
                          {item.detectedGrade && (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
                              Khối {item.detectedGrade}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target Subject Selector */}
                      <td className="py-3 px-3">
                        <div className="min-w-[200px]">
                          <select
                            id={`select-target-${item.id}`}
                            value={item.targetMode === "existing" ? item.targetSubjectId : "new"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "new") {
                                setBatchFiles((prev) =>
                                  prev.map((f) =>
                                    f.id === item.id
                                      ? { ...f, targetMode: "new", targetSubjectId: "" }
                                      : f
                                  )
                                );
                              } else {
                                setBatchFiles((prev) =>
                                  prev.map((f) =>
                                    f.id === item.id
                                      ? {
                                          ...f,
                                          targetMode: "existing",
                                          targetSubjectId: val,
                                        }
                                      : f
                                  )
                                );
                              }
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-emerald-500 focus:outline-hidden"
                          >
                            {curriculums.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.subjectName} Khối {c.grade} ({c.assignedClasses.join(", ")})
                              </option>
                            ))}
                            <option value="new">
                              + Tạo môn mới ({item.newSubjectName} K.{item.newSubjectGrade})
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* Status & Extracted Lessons Count */}
                      <td className="py-3 px-3 text-center">
                        {item.status === "processing_ai" ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 animate-pulse">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Đang AI trích xuất...</span>
                          </div>
                        ) : item.status === "applied" ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Đã áp dụng ({item.lessons.length} tiết)</span>
                          </div>
                        ) : item.status === "ready" ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <Check className="h-3.5 w-3.5" />
                            <span>Sẵn sàng: {item.lessons.length} tiết bài dạy</span>
                          </div>
                        ) : item.status === "need_ai" ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Chờ trích xuất AI</span>
                          </div>
                        ) : (
                          <div
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200"
                            title={item.errorMessage}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Lỗi đọc</span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview / Edit Lessons button */}
                          {item.lessons.length > 0 && (
                            <button
                              type="button"
                              id={`btn-preview-${item.id}`}
                              onClick={() => setPreviewingItem(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition"
                              title="Xem trước & sửa danh sách bài dạy"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Xem bài</span>
                            </button>
                          )}

                          {/* Individual AI extract button */}
                          {(item.status === "need_ai" || item.status === "error" || item.lessons.length === 0) && (
                            <button
                              type="button"
                              id={`btn-ai-extract-single-${item.id}`}
                              disabled={isBatchProcessing}
                              onClick={() => handleProcessSingleItemAI(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                              title="Trích xuất riêng tệp này bằng AI"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                              <span>AI đọc</span>
                            </button>
                          )}

                          {/* Individual apply button */}
                          {item.lessons.length > 0 && item.status !== "applied" && (
                            <button
                              type="button"
                              id={`btn-apply-single-${item.id}`}
                              onClick={() => handleApplySingleItem(item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                              title="Áp dụng riêng tệp này vào môn học"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Nạp</span>
                            </button>
                          )}

                          {/* Delete from batch */}
                          <button
                            type="button"
                            id={`btn-delete-item-${item.id}`}
                            onClick={() =>
                              setBatchFiles((prev) => prev.filter((f) => f.id !== item.id))
                            }
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                            title="Xóa tệp này khỏi danh sách"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview / Edit Lessons of a specific file in the batch */}
      {previewingItem && (
        <div
          id="modal-preview-batch-lessons"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Xem trước bài dạy: {previewingItem.fileName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tổng số tiết: <strong>{previewingItem.lessons.length} tiết</strong> • Môn ghép:{" "}
                    <strong>
                      {previewingItem.targetMode === "existing"
                        ? curriculums.find((c) => c.id === previewingItem.targetSubjectId)?.subjectName || previewingItem.newSubjectName
                        : previewingItem.newSubjectName}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewingItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Table of lessons */}
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-16 text-center">Tiết</th>
                    <th className="py-2.5 px-3">Tên bài học / Bài dạy</th>
                    <th className="py-2.5 px-3 w-48">Chủ đề / Chương</th>
                    <th className="py-2.5 px-3 w-56">ĐDDH / Thiết bị dạy học</th>
                    <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {previewingItem.lessons.map((lesson, idx) => (
                    <tr key={lesson.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">
                        {lesson.periodNumber}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={lesson.lessonTitle}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setPreviewingItem({
                              ...previewingItem,
                              lessons: previewingItem.lessons.map((l) =>
                                l.id === lesson.id ? { ...l, lessonTitle: newTitle } : l
                              ),
                            });
                          }}
                          className="w-full rounded border border-transparent px-1.5 py-1 text-xs hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={lesson.unitOrTopic || ""}
                          onChange={(e) => {
                            const newTopic = e.target.value;
                            setPreviewingItem({
                              ...previewingItem,
                              lessons: previewingItem.lessons.map((l) =>
                                l.id === lesson.id ? { ...l, unitOrTopic: newTopic } : l
                              ),
                            });
                          }}
                          placeholder="—"
                          className="w-full rounded border border-transparent px-1.5 py-1 text-xs text-slate-500 hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={lesson.equipment || ""}
                          onChange={(e) => {
                            const newEquip = e.target.value;
                            setPreviewingItem({
                              ...previewingItem,
                              lessons: previewingItem.lessons.map((l) =>
                                l.id === lesson.id ? { ...l, equipment: newEquip } : l
                              ),
                            });
                          }}
                          placeholder="—"
                          className="w-full rounded border border-transparent px-1.5 py-1 text-xs text-slate-500 hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewingItem({
                              ...previewingItem,
                              lessons: previewingItem.lessons.filter((l) => l.id !== lesson.id),
                            });
                          }}
                          className="rounded p-1 text-slate-300 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <span className="text-xs text-slate-500">
                Bạn có thể sửa trực tiếp tên bài và ĐDDH trước khi lưu.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewingItem(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Update the batchFiles state with the modified lessons
                    setBatchFiles((prev) =>
                      prev.map((f) => (f.id === previewingItem.id ? previewingItem : f))
                    );
                    handleApplySingleItem(previewingItem);
                    setPreviewingItem(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                >
                  <Check className="h-4 w-4" />
                  Lưu & Áp dụng tệp này ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
