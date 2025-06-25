import express from "express";
import { ai } from "../genaiClient.js";

const router = express.Router();

// Retry logic with backoff
async function generateWithRetry(prompt, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini.");
      return text;
    } catch (err) {
      const isOverload = err?.message?.includes("503") || err?.message?.includes("overloaded");
      if (isOverload && i < retries - 1) {
        console.warn(`Retrying Gemini (attempt ${i + 1})...`);
        await new Promise(res => setTimeout(res, delay * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}

router.post("/", async (req, res) => {
  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: "Missing 'idea' in request body." });
  }

  try {
    const prompt = `Write a short, attention-grabbing social media or blog title for the idea: "${idea}". Respond with only the title, no extra content.`;

    const rawTitle = await generateWithRetry(prompt);

    // Extract the first line, trim it
    const title = rawTitle.split("\n")[0].trim();

    res.json({ title });
  } catch (err) {
    console.error("Gemini API error:", err);

    let message = "An unexpected error occurred.";
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      message = err.message || "Unknown error";
    }

    res.status(503).json({ error: message });
  }
});

export default router;
