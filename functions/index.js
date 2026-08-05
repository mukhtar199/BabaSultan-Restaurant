import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});


app.post("/ai-chat", async (req, res) => {
  try {

    const { prompt, language, currentData } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY"
      });
    }


    const ai = new GoogleGenAI({
      apiKey
    });


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Restaurant Data:
${JSON.stringify(currentData)}

Question:
${prompt}
`,
      config:{
        responseMimeType:"application/json"
      }
    });


    return res.json(
      JSON.parse(response.text || "{}")
    );


  } catch(error:any){

    console.error(error);

    return res.status(500).json({
      error:error.message
    });

  }
});


export const api = functions.https.onRequest(app);
