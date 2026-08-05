/* eslint-disable @typescript-eslint/no-misused-promises */
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

// Health Check
app.get("/api/health", (req, res) => {
  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});


// Gemini AI Assistant
app.post("/api/ai-chat", async (req, res) => {
  try {
    const {
 prompt,
 currentData,
} = req.body;


    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
       res.status(500).json({
        error: "GEMINI_API_KEY is missing",
      });
    }


    const ai = new GoogleGenAI({
      apiKey,
    });


    const systemInstruction = `
You are the official AI Restaurant ERP Assistant.

Rules:
- Detect user language Arabic, Somali, English.
- Reply in the same language.
- Use only provided restaurant data.
- Return valid JSON.

Format:

{
 "detectedLanguage":"",
 "reply":"",
 "actionTaken":null,
 "actionPayload":null,
 "suggestedQuestions":[]
}
`;


    const userContext = `
Restaurant Data:

${JSON.stringify(currentData, null, 2)}

User Question:

${prompt}
`;


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userContext,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });


    const text = response.text || "{}";


    res.json(JSON.parse(text));


  } catch (error: any) {

    console.error(error);

     res.status(500).json({
      error: "AI request failed",
      details: error.message,
    });

  }
});


// Export Firebase Function
export const api = onRequest(app);