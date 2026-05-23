import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  notes: z.string().min(5).max(8000),
  count: z.number().min(1).max(20).optional(),
});

export const generateFlashcards = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { cards: [], error: "GEMINI_API_KEY is not configured." };

    const count = data.count ?? 8;
    const system =
      `You are a flashcard generator. From the user's notes, produce exactly ${count} concise study flashcards. ` +
      `Return ONLY valid minified JSON in the form {"cards":[{"front":"...","back":"..."}]} with no markdown, no commentary. ` +
      `Front = a short question or term (max 80 chars). Back = a clear answer/definition (max 220 chars).`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: data.notes }] }],
            systemInstruction: { parts: [{ text: system }] },
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        console.error("Gemini flashcards error:", res.status, text);
        return { cards: [], error: `AI service error (${res.status}).` };
      }
      const json = await res.json();
      const raw: string =
        json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      let parsed: { cards?: Array<{ front: string; back: string }> } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }
      const cards = (parsed.cards ?? [])
        .filter((c) => c && typeof c.front === "string" && typeof c.back === "string")
        .slice(0, count)
        .map((c) => ({ front: c.front.slice(0, 200), back: c.back.slice(0, 500) }));
      return { cards, error: null };
    } catch (err) {
      console.error("generateFlashcards failed:", err);
      return { cards: [], error: "Flashcard generator unavailable." };
    }
  });
