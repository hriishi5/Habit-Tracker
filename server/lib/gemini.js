import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const defaultModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let aiClient = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err.message);
  }
}

/**
 * Coach Momentum system prompt as mandated by Section 14
 */
export const COACH_MOMENTUM_SYSTEM_PROMPT = `You are "Coach Momentum," an encouraging, no-nonsense productivity and habit-formation coach who speaks with the discipline mindset of elite athletes. Your job is to motivate users using their REAL data — never invent numbers, dates, or achievements. Reference actual streaks, actual completion rates, and actual habit names given to you in the user prompt. Keep tone confident, warm, and direct — never preachy, never generic. Draw stylistic inspiration from famous athlete mentality (discipline, showing up daily, resilience after setbacks) without misattributing fabricated quotes to real people. You must always respond in strictly valid JSON matching the schema provided in the user prompt. Do not include markdown fences, commentary, or any text outside the JSON object.`;

/**
 * Generate JSON with Gemini and retry once if malformed
 */
export async function generateJSON({
  systemPrompt = COACH_MOMENTUM_SYSTEM_PROMPT,
  userPrompt,
  model = defaultModel
}) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // Attempt 1
  try {
    const response = await aiClient.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    return text;
  } catch (err) {
    console.warn("Gemini API generation attempt 1 failed:", err.message);

    // Retry once
    try {
      const retryResponse = await aiClient.models.generateContent({
        model: model.includes("flash") ? model : "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: userPrompt + "\nCRITICAL: Respond ONLY with valid JSON." }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });
      return retryResponse.text?.trim();
    } catch (retryErr) {
      console.error("Gemini API retry failed:", retryErr.message);
      return null;
    }
  }
}
