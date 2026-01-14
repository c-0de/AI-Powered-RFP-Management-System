import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const LLM_PROVIDER = process.env.LLM ? process.env.LLM.toUpperCase() : 'GOOGLE';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

console.log(`Initializing AI Service with Provider: ${LLM_PROVIDER}`);

// Clients
let googleAi, groqAi;

if (LLM_PROVIDER === 'GOOGLE') {
    if (!GOOGLE_API_KEY) console.error("Missing GOOGLE_API_KEY");
    googleAi = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
} else if (LLM_PROVIDER === 'GROQ') {
    if (!GROQ_API_KEY) console.error("Missing GROQ_API_KEY");
    groqAi = new Groq({ apiKey: GROQ_API_KEY });
}

// Helper: Clean JSON
const cleanJson = (text) => {
    // Remove markdown code blocks
    let clean = text.replace(/```json|```/g, '').trim();

    // Attempt to extract the first valid JSON object block
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');

    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        clean = clean.substring(firstOpen, lastClose + 1);
    }

    return clean;
};

// Helper: Unified Generation Function
const generateText = async (prompt) => {
    try {
        if (LLM_PROVIDER === 'GOOGLE') {
            const result = await googleAi.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt
            });
            return result.text;
        } else if (LLM_PROVIDER === 'GROQ') {
            const completion = await groqAi.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: GROQ_MODEL,
            });
            return completion.choices[0]?.message?.content || "";
        } else {
            throw new Error(`Unsupported LLM Provider: ${LLM_PROVIDER}`);
        }
    } catch (error) {
        console.error(`${LLM_PROVIDER} Generation Error:`, error);
        throw error;
    }
};

export const parseRFPRequirement = async (text) => {
    try {
        const prompt = `
      You are a strict data extraction assistant. 
      Extract details from the procurement request text into a valid, standard JSON object.
      
      Rules:
      1. Return ONLY the JSON object. No intro text, no markdown formatting.
      2. Strict JSON only (RFC 8259). No trailing commas. No comments.
      3. Keys must be quoted.
      
      Fields to extract:
      - title (short summary)
      - description (original text)
      - items (array of objects with itemName, quantity, specs)
      - budget (number, null if missing)
      - currency (string, e.g. "USD")
      - deadline (YYYY-MM-DD format if available, else null)
      
      Request: "${text}"
    `;

        const responseText = await generateText(prompt);
        return JSON.parse(cleanJson(responseText));
    } catch (error) {
        console.error("AI Parsing Error:", error);
        console.error("Response Text was:", await generateText(prompt).catch(e => "Error regenerating")); // This is risky, don't regenerate in catch
        throw new Error("Failed to parse RFP requirements: " + error.message);
    }
};

export const parseVendorResponse = async (emailBody) => {
    try {
        const prompt = `
      You are a strict data extraction assistant.
      Extract details from the vendor proposal email into a valid, standard JSON object.
      
      Rules:
      1. Return ONLY the JSON object.
      2. Strict JSON (No trailing commas, no comments).
      
      Fields:
      - totalPrice (number)
      - deliveryTime (string)
      - warranty (string)
      - lineItems (array of objects with itemName, price, comments)
      
      Email: "${emailBody}"
    `;

        const responseText = await generateText(prompt);
        return JSON.parse(cleanJson(responseText));
    } catch (error) {
        console.error("AI Parsing Error:", error);
        throw new Error("Failed to parse vendor response: " + error.message);
    }
};

export const compareProposals = async (rfp, proposals) => {
    try {
        const prompt = `
      Compare these proposals for the RFP: "${rfp.title}".
      
      RFP Budget: ${rfp.budget}
      
      Proposals:
      ${JSON.stringify(proposals.map(p => ({
            vendor: p.vendor.name,
            totalPrice: p.extractedData.totalPrice,
            delivery: p.extractedData.deliveryTime,
            warranty: p.extractedData.warranty
        })))}
      
      Provide a brief recommendation on which vendor to choose and why. Return a plain text summary.
    `;

        return await generateText(prompt);
    } catch (error) {
        console.error("AI Comparison Error:", error);
        throw new Error("Failed to compare proposals: " + error.message);
    }
};
