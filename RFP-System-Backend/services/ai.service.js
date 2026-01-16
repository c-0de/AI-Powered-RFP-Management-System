import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import nunjucks from 'nunjucks';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LLM_PROVIDER = process.env.LLM ? process.env.LLM.toUpperCase() : 'GOOGLE';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

console.log(`Initializing AI Service with Provider: ${LLM_PROVIDER}`);

// Configure Nunjucks
nunjucks.configure(path.join(__dirname, '../prompts'), { autoescape: true });

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
const generateText = async (systemPrompt, userPrompt) => {
    try {
        if (LLM_PROVIDER === 'GOOGLE') {
            // For Google GenAI, system instructions can be passed in config
            // Or if strict role separation is needed in contents
            const result = await googleAi.models.generateContent({
                model: GEMINI_MODEL,
                config: {
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    }
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: userPrompt }]
                }]
            });
            return result.text;
        } else if (LLM_PROVIDER === 'GROQ') {
            const completion = await groqAi.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
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
    let responseText = "";
    try {
        const systemPrompt = nunjucks.render('rfp_extraction_system.jinja');
        const userPrompt = nunjucks.render('rfp_extraction_user.jinja', { text });

        responseText = await generateText(systemPrompt, userPrompt);
        const parsedData = JSON.parse(cleanJson(responseText));

        // Logic to calculate deadline if date is missing but time (days) is available
        if (!parsedData.date && !parsedData.deadline && parsedData.time) {
            const days = parseInt(parsedData.time);
            if (!isNaN(days)) {
                const deadlineDate = new Date();
                deadlineDate.setDate(deadlineDate.getDate() + days);
                parsedData.deadline = deadlineDate.toISOString(); // Store as ISO string
            }
        } else if (parsedData.date) {
            // Normalize 'date' field from prompt to 'deadline' field for model/frontend
            parsedData.deadline = parsedData.date;
        }

        return parsedData;
    } catch (error) {
        console.error("AI Parsing Error:", error);
        console.error("Raw AI Response:", responseText); // Log actual AI response
        // Return a safe fallback object to prevent system crash
        return {
            title: "RFP Extraction Failed",
            description: text || "Could not parse RFP details. Please enter manually.",
            items: [],
            budget: null,
            currency: "USD",
            time: null,
            deadline: null,
            parsingError: true
        };
    }
};

export const parseVendorResponse = async (emailBody) => {
    let responseText = "";
    try {
        const systemPrompt = nunjucks.render('vendor_response_system.jinja');
        const userPrompt = nunjucks.render('vendor_response_user.jinja', { emailBody });

        responseText = await generateText(systemPrompt, userPrompt);
        let parsedData = JSON.parse(cleanJson(responseText));

        // Sanitize Data (Ensure numbers for prices)
        if (parsedData.totalPrice && typeof parsedData.totalPrice !== 'number') {
            const parsedPrice = parseFloat(parsedData.totalPrice);
            parsedData.totalPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
        }

        if (Array.isArray(parsedData.lineItems)) {
            parsedData.lineItems = parsedData.lineItems.map(item => {
                let price = item.price;
                if (typeof price !== 'number') {
                    price = parseFloat(price);
                    if (isNaN(price)) price = 0;
                }
                return { ...item, price };
            });
        }

        return parsedData;
    } catch (error) {
        console.error("AI Parsing Error (Vendor Response):", error);
        console.error("Raw AI Response:", responseText);
        // Fallback or rethrow? If this fails, the vendor process fails. 
        // Better to throw but with more info, or return null? 
        // If we return null, the caller might crash if expecting object.
        // Let's return a basic object indicating failure.
        return {
            error: "Failed to parse vendor response",
            originalText: emailBody
        };
    }
};

export const compareProposals = async (rfp, proposals) => {
    try {
        const proposalsJson = JSON.stringify(proposals.map(p => ({
            vendor: p.vendor.companyName,
            totalPrice: p.totalPrice,
            delivery: p.deliveryTime,
            warranty: p.warranty,
            validity_period: p.validity_period,
            key_highlights: p.key_highlights,
            proposal_summary: p.proposalBody,
            requirements_analysis: p.requirements_analysis,
            lineItems: p.lineItems
        })));

        const systemPrompt = nunjucks.render('proposal_comparison_system.jinja');
        const userPrompt = nunjucks.render('proposal_comparison_user.jinja', { rfp, proposals_json: proposalsJson });

        return await generateText(systemPrompt, userPrompt);
    } catch (error) {
        console.error("AI Comparison Error:", error);
        throw new Error("Failed to compare proposals: " + error.message);
    }
};
