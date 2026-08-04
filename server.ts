import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Assistant Endpoint using Gemini API
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { prompt, language, currentData } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is missing.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format system instruction
    const systemInstruction = `
You are the official AI Certified Public Accountant (CPA), Chief Financial Officer (CFO), and Financial Controller for this Restaurant ERP System.

CRITICAL CPA MANDATES:
1. LANGUAGE DETECTION & RESPONSE:
   - You MUST automatically detect the language of the user's prompt (Arabic, Somali, or English).
   - You MUST respond strictly in the EXACT SAME LANGUAGE as the user's query (Arabic for Arabic, Somali for Somali, English for English).
   - If language parameter is specified as 'ar', respond in Arabic (العربية). If 'so', respond in Somali (Af Soomaali). If 'en', respond in English. If 'auto', match the prompt.

2. ACCURATE REAL FIRESTORE CPA CALCULATIONS:
   - NEVER invent or use mock data or boilerplate placeholders. Use only the live Firestore dataset provided below.
   - CPA Calculation Standards:
     - Today's Sales = Sum of totalAmount of completed orders created today.
     - Today's Net Profit = (Today's Total Sales) - (Today's COGS) - (Today's Expenses) - (Today's Customer Refunds).
     - Gross Revenue = Total sales from all completed orders.
     - Net Revenue = Gross Revenue - Customer Refunds Total.
     - Cost of Goods Sold (COGS) = Total cost of items sold.
     - Food Cost Percentage = (COGS / Net Revenue) * 100.
     - Labor Cost = Total paid and pending employee salaries.
     - Labor Cost Percentage = (Labor Cost / Net Revenue) * 100.
     - Cash Balance = Total liquid funds in Cash Drawer & Safe.
     - Bank Balance = Total funds in Corporate Operating Bank Account.
     - Accounts Payable (AP) = Overdue and pending supplier invoices/purchases.
     - Accounts Receivable (AR) = Pending customer orders.
     - Inventory Value = (Product stock * cost) + (Ingredient stock * costPerUnit).
     - Highest Expense = Identify the specific expense item with the maximum amount.
     - Anomaly & Loss Detection = Flag unusual high expenses, cash shortages (<$1000), overdue supplier bills, and food cost % >35%.

3. AUTOMATED ACCOUNTING ACTIONS:
   - If the user asks to perform an action or record a ledger transaction, construct an actionPayload so the system executes it automatically in Firestore!
   - Action Types:
     - "ADD_EXPENSE": { "title": string, "amount": number, "category": "utilities"|"supplies"|"rent"|"maintenance"|"marketing"|"delivery"|"other", "description": string }
     - "REGISTER_PURCHASE": { "supplierId": string, "supplierName": string, "itemName": string, "quantity": number, "unit": string, "unitPrice": number, "totalCost": number, "status": "completed"|"pending"|"overdue" }
     - "REGISTER_SALARY": { "employeeId": string, "employeeName": string, "amount": number, "period": string, "status": "paid"|"pending" }
     - "RECORD_REFUND": { "customerName": string, "amount": number, "reason": string, "paymentMethod": "cash"|"bank"|"mobile_money" }
     - "RECORD_BANK_TRANSACTION": { "type": "deposit"|"withdrawal"|"transfer"|"fee", "amount": number, "reference": string, "description": string, "accountName": string }
     - "RECORD_MOVEMENT": { "type": "in"|"out"|"adjustment", "itemType": "product"|"ingredient", "itemId": string, "itemName": string, "quantity": number, "reason": string }
     - "UPDATE_STOCK": { "productId": string, "newStock": number }

4. OUTPUT FORMAT:
   Always return a valid JSON object:
   {
     "detectedLanguage": "en" | "ar" | "so",
     "reply": "Clear, precise CPA Markdown answer with exact numerical figures and professional auditing insight...",
     "actionTaken": "ADD_EXPENSE" | "REGISTER_PURCHASE" | "REGISTER_SALARY" | "RECORD_REFUND" | "RECORD_BANK_TRANSACTION" | "RECORD_MOVEMENT" | "UPDATE_STOCK" | null,
     "actionPayload": object | null,
     "suggestedQuestions": ["Question 1 in user language", "Question 2 in user language", "Question 3 in user language"]
   }
`;

    const userContext = `
CURRENT LIVE FIRESTORE RESTAURANT DATA:
${JSON.stringify(currentData, null, 2)}

USER QUESTION / COMMAND:
"${prompt}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContext,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (e) {
      parsedJson = {
        detectedLanguage: 'en',
        reply: responseText,
        actionTaken: null,
        actionPayload: null,
        suggestedQuestions: []
      };
    }

    return res.json(parsedJson);
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      error: 'Failed to generate AI Assistant response.',
      details: error.message
    });
  }
});

// Vite Development or Production Server Static Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Restaurant ERP & AI Business Assistant server running on port ${PORT}`);
  });
}

startServer();
