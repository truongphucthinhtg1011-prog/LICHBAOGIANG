import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: Parse Phân phối chương trình (PPCT)
app.post("/api/gemini/parse-ppct", async (req, res) => {
  try {
    const { rawText, subject, grade, fileBase64, mimeType, fileName } = req.body;
    if (!rawText && !fileBase64) {
      return res.status(400).json({ error: "Vui lòng cung cấp văn bản hoặc tệp đính kèm PPCT" });
    }

    const ai = getAIClient();
    const prompt = `Bạn là chuyên gia giáo dục Việt Nam. Hãy đọc kỹ tài liệu Kế hoạch bài dạy / Phân phối chương trình (PPCT) dưới đây và trích xuất toàn bộ danh sách các bài dạy theo thứ tự chuẩn.
Môn học gợi ý: ${subject || "Tự động phát hiện"}
Khối lớp gợi ý: ${grade || "Tự động phát hiện"}
Tên tệp: ${fileName || "Tài liệu PPCT"}

${rawText ? `NỘI DUNG TÀI LIỆU:\n"""\n${rawText}\n"""` : "Nội dung nằm trong tệp đính kèm đính kèm bên dưới."}

YÊU CẦU:
Trích xuất đầy đủ tất cả các tiết (từ tiết 1 đến hết), mỗi tiết gồm:
- periodNumber: số tiết PPCT (1, 2, 3...)
- lessonTitle: Tên bài dạy / Nội dung bài học (bỏ chữ 'Tiết X:' nếu có ở đầu)
- unitOrTopic: Tên chương / Chủ đề / Phần (nếu có)
- equipment: Thiết bị dạy học / ĐDDH (máy tính, máy chiếu, bảng phụ, tranh ảnh, mẫu vật, phiếu học tập... nếu tài liệu có ghi hoặc đề xuất phù hợp)
- notes: Ghi chú (nếu có)`;

    const contents: any[] = [prompt];
    if (fileBase64 && mimeType) {
      contents.push({
        inlineData: {
          mimeType,
          data: fileBase64,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: "Bạn là trợ lý chuyên gia hỗ trợ giáo viên Việt Nam lập Kế hoạch dạy học, Phân phối chương trình và Lịch báo giảng chuẩn xác.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Danh sách các tiết phân phối chương trình",
          items: {
            type: Type.OBJECT,
            properties: {
              periodNumber: { type: Type.INTEGER, description: "Tiết theo PPCT (1, 2, 3...)" },
              lessonTitle: { type: Type.STRING, description: "Tên bài dạy / Bài học" },
              unitOrTopic: { type: Type.STRING, description: "Chủ đề hoặc Chương" },
              equipment: { type: Type.STRING, description: "Thiết bị dạy học / ĐDDH" },
              notes: { type: Type.STRING, description: "Ghi chú" },
            },
            required: ["periodNumber", "lessonTitle"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    return res.json({ success: true, items: parsed });
  } catch (error: any) {
    console.error("Error parsing PPCT:", error);
    return res.status(500).json({
      error: error?.message || "Không thể phân tích tài liệu PPCT. Vui lòng thử lại hoặc kiểm tra định dạng.",
    });
  }
});

// API: Parse Thời khóa biểu (TKB)
app.post("/api/gemini/parse-tkb", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Nội dung Thời khóa biểu không được để trống" });
    }

    const ai = getAIClient();
    const prompt = `Bạn là trợ lý giáo dục Việt Nam. Hãy đọc kỹ văn bản Thời khóa biểu (TKB) dưới đây của giáo viên và chuyển đổi thành danh sách các tiết dạy trong tuần từ Thứ 2 đến Thứ 6.

Lưu ý:
- dayOfWeek: Thứ trong tuần (chỉ lấy 2, 3, 4, 5, 6 tương ứng Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6)
- session: "morning" (Buổi Sáng) hoặc "afternoon" (Buổi Chiều)
- period: Tiết thứ mấy trong buổi (1, 2, 3, 4, hoặc 5)
- className: Tên lớp (ví dụ: "9A1", "8B", "6A3", "12C1")
- subject: Tên môn học (ví dụ: "Toán", "Hình học", "Đại số", "Tin học", "Ngữ văn", "Tiếng Anh", "KHTN", "Hóa học", "Vật lí")
- room: Phòng học (nếu có, nếu không thì để trống)

VĂN BẢN ĐẦU VÀO:
"""
${rawText}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn phân tích văn bản TKB trường học Việt Nam thành dữ liệu có cấu trúc chính xác.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Danh sách các tiết dạy trong TKB từ Thứ 2 đến Thứ 6",
          items: {
            type: Type.OBJECT,
            properties: {
              dayOfWeek: { type: Type.INTEGER, description: "2, 3, 4, 5, hoặc 6" },
              session: { type: Type.STRING, description: "'morning' hoặc 'afternoon'" },
              period: { type: Type.INTEGER, description: "Tiết 1 đến 5" },
              className: { type: Type.STRING, description: "Tên lớp dạy" },
              subject: { type: Type.STRING, description: "Môn dạy" },
              room: { type: Type.STRING, description: "Phòng học (tùy chọn)" },
            },
            required: ["dayOfWeek", "session", "period", "className", "subject"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    return res.json({ success: true, slots: parsed });
  } catch (error: any) {
    console.error("Error parsing TKB:", error);
    return res.status(500).json({
      error: error?.message || "Không thể phân tích Thời khóa biểu. Vui lòng thử lại.",
    });
  }
});

// API: AI Assistant for Teaching Schedule optimization / note generation
app.post("/api/gemini/assist", async (req, res) => {
  try {
    const { prompt: userPrompt, context } = req.body;
    const ai = getAIClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Ngữ cảnh lịch báo giảng:\n${JSON.stringify(context || {})}\n\nYêu cầu của giáo viên:\n${userPrompt}`,
      config: {
        systemInstruction: "Bạn là chuyên gia cố vấn giảng dạy Việt Nam. Hãy trả lời ngắn gọn, thiết thực, chuẩn mực sư phạm.",
      },
    });

    return res.json({ answer: response.text });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Lỗi xử lý yêu cầu." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
