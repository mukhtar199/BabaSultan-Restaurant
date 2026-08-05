import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!))
  });
}

const db = getFirestore();

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
    const { prompt } = req.body;

    const [
      ordersSnap,
      productsSnap,
      ingredientsSnap,
      inventorySnap,
      expensesSnap,
      employeesSnap,
      suppliersSnap,
      customersSnap
    ] = await Promise.all([
      db.collection("orders").get(),
      db.collection("products").get(),
      db.collection("ingredients").get(),
      db.collection("inventory").get(),
      db.collection("expenses").get(),
      db.collection("employees").get(),
      db.collection("suppliers").get(),
      db.collection("customers").get()
    ]);

    const currentData = {
      orders: ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      products: productsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      ingredients: ingredientsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      inventory: inventorySnap.docs.map(d => ({ id: d.id, ...d.data() })),
      expenses: expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      employees: employeesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      suppliers: suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      customers: customersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };

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
      model: "gemini-2.0-flash",

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
- Reply in the same language as the user (Arabic, Somali, or English).
- Use ONLY the Firestore data provided.
- Never invent numbers.
- Return JSON only.

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

  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}