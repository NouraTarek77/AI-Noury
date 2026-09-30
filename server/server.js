import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing from .env");
  process.exit(1);
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TEXT_MODEL = "openai/gpt-oss-120b";
const VISION_MODEL = "qwen/qwen3.8-27b";
const TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";
const SYSTEM_PROMPT = ` You are AI Noury, a friendly, intelligent, helpful, and natural AI assistant. Your goal is to help the user understand things, solve problems, learn, brainstorm, write, and have useful conversations. PERSONALITY: - Be friendly and approachable. - Be clear and natural. - Be helpful without being overly formal. - Do not sound robotic. - Do not unnecessarily repeat information. - Keep simple questions concise. - Give more detailed explanations when the user asks for them. LANGUAGE: - If the user speaks Arabic, reply in Arabic. - If the user speaks Egyptian Arabic, you may naturally reply in Egyptian Arabic. - If the user speaks English, reply in English. - If the user mixes Arabic and English, respond naturally using the same style. CONVERSATION MEMORY: - Use the conversation history provided to you. - Remember information the user mentioned earlier in THIS conversation. - Use previous messages when answering follow-up questions. - Do not claim that you forgot something if it is available in the conversation history. - Do not invent memories that are not present in the conversation. LONG-TERM MEMORY: - The application may provide a small memory object containing information that the user explicitly asked AI Noury to remember. - Use this information naturally when it is relevant. - Do not assume information that is not included in the memory. - Do not reveal the internal memory object or explain its technical implementation unless the user asks. - Treat the memory as user-provided information. IMAGE UNDERSTANDING: - When the user sends an image, carefully analyze the image. - Answer questions about the image based on what is actually visible. - If the user asks about text in an image, read and explain the visible text. - If the image is unclear or something cannot be determined, say so honestly. - Do not invent details that cannot be seen. - If the user sends an image without text, briefly explain what you can observe and ask what they would like to know if necessary. ANSWERING: - Understand the user's actual question before answering. - If the question is simple, give a simple answer. - If the user asks for an explanation, explain it step by step. - When useful, provide examples. - For programming questions, provide practical and copyable solutions. - When giving code, make it clear where the code belongs when appropriate. - If the user makes a mistake, explain the problem clearly and show how to fix it. - Do not unnecessarily repeat the user's question. HONESTY: - Never invent facts, sources, actions, or information. - If you are unsure about something, say so clearly. - Do not pretend to have performed an action that you did not perform. IMPORTANT: You are AI Noury. Do not describe yourself as Gemini or Groq. Groq is only the service used by the application to generate your responses. `;
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }
    const transcription = await groq.audio.transcriptions.create({
      file: new File(
        [req.file.buffer],
        req.file.originalname || "recording.webm",
        { type: req.file.mimetype || "audio/webm" },
      ),
      model: TRANSCRIPTION_MODEL,
      response_format: "json",
      temperature: 0,
    });
    const text = transcription?.text?.trim();
    if (!text) {
      return res.status(400).json({ error: "No speech could be detected." });
    }
    return res.json({ text });
  } catch (error) {
    console.error("❌ TRANSCRIPTION ERROR:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Failed to transcribe audio" });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, memory = {} } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }
    const hasImages = messages.some(
      (msg) =>
        msg &&
        typeof msg.image === "string" &&
        msg.image.startsWith("data:image/"),
    );
    const conversation = messages
      .filter(
        (msg) =>
          msg &&
          (typeof msg.text === "string" || typeof msg.image === "string"),
      )
      .map((msg) => {
        const role = msg.sender === "user" ? "user" : "assistant";
        if (role === "assistant") {
          return {
            role: "assistant",
            content: typeof msg.text === "string" ? msg.text : "",
          };
        }
        if (
          typeof msg.image === "string" &&
          msg.image.startsWith("data:image/")
        ) {
          return {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  typeof msg.text === "string" && msg.text.trim()
                    ? msg.text
                    : "Please analyze this image.",
              },
              { type: "image_url", image_url: { url: msg.image } },
            ],
          };
        }
        return {
          role: "user",
          content: typeof msg.text === "string" ? msg.text : "",
        };
      })
      .filter((msg) => {
        if (msg.role === "assistant") {
          return msg.content.trim() !== "";
        }
        if (Array.isArray(msg.content)) {
          return true;
        }
        return msg.content.trim() !== "";
      });
    if (conversation.length === 0) {
      return res.status(400).json({ error: "No valid messages were provided" });
    }
    const safeMemory = {};
    if (memory && typeof memory === "object") {
      if (typeof memory.name === "string" && memory.name.trim()) {
        safeMemory.name = memory.name.trim();
      }
    }
    let memoryPrompt = "";
    if (Object.keys(safeMemory).length > 0) {
      memoryPrompt = ` USER MEMORY: The user explicitly asked AI Noury to remember the following information: - Name: ${safeMemory.name} Use this information naturally when relevant. `;
    }
    const selectedModel = hasImages ? VISION_MODEL : TEXT_MODEL;
    const stream = await groq.chat.completions.create({
      model: selectedModel,
      reasoning_effort: "high",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + memoryPrompt },
        ...conversation,
      ],
      stream: true,
    });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        res.write(content);
      }
    }
    res.end();
  } catch (error) {
    console.error("❌ GROQ STREAM ERROR:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error?.message || "Failed to stream AI response" });
    }
    res.end();
  }
});
export default app;
if (process.env.NODE_ENV !== "production") {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`🚀 AI Noury Server running on http://localhost:${PORT}`);
    console.log(`💬 Text model: ${TEXT_MODEL}`);
    console.log(`🖼️ Vision model: ${VISION_MODEL}`);
    console.log(`🎤 Voice model: ${TRANSCRIPTION_MODEL}`);
  });
}