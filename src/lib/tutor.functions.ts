import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AttachmentSchema = z.object({
  mimeType: z.string().min(1).max(100),
  data: z.string().min(1), // base64 (no data: prefix)
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
  attachments: z.array(AttachmentSchema).max(5).optional(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  mode: z.enum(["default", "stepByStep"]).optional(),
});

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { reply: "", error: "GEMINI_API_KEY is not configured." };
    }

    const baseInstruction =
      "You are AI Teaching Studio's tutor — friendly, concise, and accurate. " +
      "Explain concepts clearly, use markdown, include short examples when helpful.";

    const stepInstruction =
      " IMPORTANT: Respond in a STEP-BY-STEP teaching format. " +
      "Number each step (Step 1, Step 2, …). Each step should cover ONE small idea with a brief explanation. " +
      "End with a one-line summary and a follow-up question to check understanding. " +
      "If the user uploaded an image or notes, first describe what you see, then solve step-by-step.";

    const systemInstruction = baseInstruction + (data.mode === "stepByStep" ? stepInstruction : "");

    const contents = data.messages.map((m) => {
      const parts: Array<Record<string, unknown>> = [];
      if (m.content) parts.push({ text: m.content });
      for (const a of m.attachments ?? []) {
        parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
      }
      if (parts.length === 0) parts.push({ text: "" });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Gemini error:", res.status, text);
        if (res.status === 429) {
          return { reply: "", error: "Rate limit reached on your Gemini API key. Wait a minute and retry, or upgrade your Google AI plan." };
        }
        return { reply: "", error: `AI service error (${res.status}).` };
      }

      const json = await res.json();
      const reply =
        json?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") ?? "";

      return { reply: reply || "I couldn't generate a response. Try rephrasing.", error: null };
    } catch (err) {
      console.error("askTutor failed:", err);
      return { reply: "", error: "The tutor is temporarily unavailable." };
    }
  });
