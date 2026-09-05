import React, { useState } from "react";
import { X, Sparkles, Send, RefreshCw, Bot, CheckCircle2 } from "lucide-react";
import { ScheduleEntry, TeacherProfile } from "../types";
import { WeekInfo } from "../utils/dateUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entries: ScheduleEntry[];
  weekInfo: WeekInfo;
  profile: TeacherProfile;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export const AIAssistantDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  entries,
  weekInfo,
  profile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: `Xin chào thầy/cô ${profile.fullName}! Tôi là trợ lý AI sư phạm. Tôi có thể hỗ trợ thầy/cô gợi ý đồ dùng dạy học (ĐDDH), đề xuất phương án dạy bù khi có lịch nghỉ lễ, hoặc kiểm tra tiến độ phân phối chương trình của Tuần ${weekInfo.weekNumber}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim()) return;

    const newMsgs: ChatMessage[] = [...messages, { role: "user", text: promptToSend }];
    setMessages(newMsgs);
    if (!customPrompt) setInput("");
    setIsLoading(true);

    try {
      const context = {
        weekNumber: weekInfo.weekNumber,
        dateRange: weekInfo.rangeText,
        teacher: profile.fullName,
        school: profile.schoolName,
        totalPeriods: entries.length,
        scheduleSummary: entries.map((e) => ({
          day: e.dayOfWeek,
          period: e.period,
          class: e.className,
          subject: e.subject,
          ppctPeriod: e.ppctPeriod,
          lessonTitle: e.lessonTitle,
        })),
      };

      const res = await fetch("/api/gemini/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend, context }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể kết nối với AI");
      }

      setMessages([...newMsgs, { role: "model", text: data.answer || "Không có phản hồi." }]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          role: "model",
          text: `Đã xảy ra lỗi: ${err.message || "Vui lòng kiểm tra kết nối mạng."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_QUESTIONS = [
    `Gợi ý thiết bị dạy học (ĐDDH) phù hợp cho các bài dạy Tuần ${weekInfo.weekNumber}`,
    "Hướng dẫn xử lý khi tiết dạy trùng vào ngày nghỉ lễ mà không bị trễ phân phối chương trình",
    "Kiểm tra số tiết dạy của các lớp trong tuần này đã đồng đều chưa?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs no-print animate-in fade-in duration-150">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Trợ lý AI Lịch Báo Giảng
              </h3>
              <p className="text-[11px] text-slate-500">
                Cố vấn chuyên môn & tiến độ giảng dạy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-600">
            Gợi ý câu hỏi nhanh:
          </p>
          <div className="flex flex-col gap-1">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSend(q)}
                className="text-left rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 transition disabled:opacity-50 line-clamp-2"
              >
                💡 {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-xs"
                    : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600 border border-slate-200/60">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
                <span>AI đang phân tích và soạn phản hồi...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t border-slate-200 p-3 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Đặt câu hỏi hoặc yêu cầu hỗ trợ..."
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-indigo-600 px-3.5 py-2 text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-xs"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
