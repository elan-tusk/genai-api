import express from "express";
import { ai } from "../genaiClient.js";

const router = express.Router();

// Shared retry function
async function generateWithRetry(prompt, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Empty response from Gemini.");
            return text.trim();
        } catch (err) {
            const overload = err.message?.includes("503") || err.message?.includes("overloaded");
            if (overload && i < retries - 1) {
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
        const [titleRaw, descRaw, keywordsRaw, tagsRaw] = await Promise.all([
            generateWithRetry(`Write a catchy title for a blog or social media post about: "${idea}". Only return the title.`),
            generateWithRetry(`Write a short and engaging description (2-3 sentences) for a social media post about: "${idea}". Avoid hashtags or emojis.`),
            generateWithRetry(`List exactly 10 SEO-friendly keywords for this idea: "${idea}". Just a numbered list. No explanations.`),
            generateWithRetry(`Generate 10 relevant and popular hashtags for this social media idea: "${idea}". Only return the hashtags, no formatting or explanations.`)
        ]);

        const title = titleRaw.split("\n")[0];

        const description = descRaw.split("\n")[0];

        const keywords = keywordsRaw
            .split("\n")
            .map(line => line.replace(/^\d+\.\s*/, "").trim())
            .filter(k => k.length > 0);

        const tags = tagsRaw
            .split(/[\n, ]+/)
            .map(tag => tag.trim())
            .filter(tag => tag.startsWith("#"))
            .filter((tag, idx, arr) => tag && arr.indexOf(tag) === idx); // dedupe

        res.json({ title, description, keywords, tags });

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
