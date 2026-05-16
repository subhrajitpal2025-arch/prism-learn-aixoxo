import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  exam: z.string().max(80).optional().default(""),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("medium"),
  count: z.number().int().min(3).max(20).default(10),
});

export type QuizQuestion = {
  q: string;
  opts: [string, string, string, string];
  a: number;
  explanation?: string;
};

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { questions: [] as QuizQuestion[], error: "GEMINI_API_KEY is not configured." };
    }

    const examLine = data.exam ? `Exam context: ${data.exam}.` : "";
    const prompt =
      `Generate ${data.count} ${data.difficulty} multiple-choice questions.\n` +
      `Subject: ${data.subject}\nTopic: ${data.topic}\n${examLine}\n` +
      `Rules: each question must have exactly 4 distinct options, one correct. ` +
      `Vary the correct answer index. Keep questions concise and unambiguous. ` +
      `Return ONLY JSON of shape: ` +
      `{"questions":[{"q":"...","opts":["a","b","c","d"],"a":0,"explanation":"..."}]}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.9,
            },
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Gemini quiz error:", res.status, text);
        if (res.status === 429) {
          return { questions: [], error: "Rate limit reached. Wait a moment and retry." };
        }
        return { questions: [], error: `AI service error (${res.status}).` };
      }

      const json = await res.json();
      const raw: string =
        json?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") ?? "";

      let parsed: { questions?: QuizQuestion[] } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      const questions = (parsed.questions ?? []).filter(
        (q): q is QuizQuestion =>
          !!q &&
          typeof q.q === "string" &&
          Array.isArray(q.opts) &&
          q.opts.length === 4 &&
          typeof q.a === "number" &&
          q.a >= 0 &&
          q.a < 4
      );

      if (questions.length === 0) {
        return { questions: [], error: "Couldn't parse questions. Please retry." };
      }

      return { questions, error: null };
    } catch (err) {
      console.error("generateQuiz failed:", err);
      return { questions: [], error: "Quiz generator is temporarily unavailable." };
    }
  });
