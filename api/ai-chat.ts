import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      prompt,
      currentData
    } = req.body;


    const apiKey = process.env.GEMINI_API_KEY;


    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing"
      });
    }


    const ai = new GoogleGenAI({
      apiKey
    });


    const response = await ai.models.generateContent({

      model: "gemini-2.5-flash",

      contents: `
Restaurant ERP Data:

${JSON.stringify(currentData, null, 2)}

User Question:

${prompt}
`,

      config: {

        systemInstruction: `
You are Baba Sultan Restaurant AI Assistant.

Rules:
- Reply Arabic, Somali or English depending on user language.
- Use only provided data.
- Return JSON.

Format:

{
"detectedLanguage":"",
"reply":"",
"actionTaken":null,
"actionPayload":null,
"suggestedQuestions":[]
}
`,

        responseMimeType: "application/json"
      }

    });


    return res.status(200).json(
      JSON.parse(response.text || "{}")
    );


  } catch(error:any){

    console.error(error);

    return res.status(500).json({
      error:error.message
    });

  }
}