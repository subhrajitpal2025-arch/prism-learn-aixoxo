import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
});

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { reply: "", error: "GEMINI_API_KEY is not configured." };
    }

    const systemInstruction =
      "You are AI Teaching Studio's tutor — friendly, concise, and accurate. " +
      "Explain concepts step-by-step, use markdown, include short examples when helpful.";

    const contents = data.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
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
