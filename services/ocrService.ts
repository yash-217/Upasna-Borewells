import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const apiKey = import.meta.env.VITE_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface OCRResult {
    date?: string;
    amount?: string;
    recipient?: string;
    expense_type?: 'Fuel' | 'Maintenance' | 'Salary' | 'Miscellaneous';
    raw_text?: string;
    confidence?: number;
}

export interface ServiceRequestOCRResult {
    customerName?: string;
    phone?: string;
    address?: string;
    city?: string;
    date?: string;
    notes?: string;
    // Drilling details
    drillingDepth?: number;
    drillingRate?: number; // Base rate (first 300ft)
    // Casing details
    casingDepth?: number;   // 7" casing
    casingRate?: number;
    casing10Depth?: number; // 10" casing
    casing10Rate?: number;
    // Products/Items
    items?: Array<{ name: string; price: number }>;
}

/**
 * Convert a File to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Scan a receipt or payment screenshot using Gemini Vision
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(base64: string, prompt: string, mimeType: string, attempt = 1): Promise<string> {
    const models = ['gemini-2.5-flash', 'gemini-3-flash', 'gemini-1.5-flash-latest'];

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64, mimeType } }
            ]);
            return result.response.text();
        } catch (error: any) {
            if (error?.status === 429 || error?.toString().includes('429')) {
                console.warn(`Rate limit hit on ${modelName}, trying next model or retrying...`);
                await delay(2000 * attempt); // Wait 2s, 4s, etc.
                continue;
            }
            throw error; // Rethrow other errors
        }
    }
    throw new Error('All models failed or rate limited');
}

/**
 * Scan a receipt or payment screenshot using Gemini Vision
 */
export const scanReceiptWithGemini = async (file: File): Promise<OCRResult> => {
    const base64 = await fileToBase64(file);

    const prompt = `Analyze this image of a payment receipt, UPI screenshot, or expense document.

Extract the following fields:
1. date - Transaction date in YYYY-MM-DD format
2. amount - The main transaction amount as a number (no currency symbols, no commas)
3. recipient - Name of the person or business that was paid
4. expense_type - Categorize as one of: "Fuel", "Maintenance", "Salary", or "Miscellaneous"
   - Use "Fuel" if it mentions petrol, diesel, gas, fuel pump, station
   - Use "Maintenance" if it mentions repair, service, parts, tyre, garage, mechanic
   - Use "Salary" if it mentions salary, wage, advance, staff payment
   - Use "Miscellaneous" for everything else

If the image contains handwritten text, extract what you can read.
If a field cannot be determined, use an empty string.

IMPORTANT: Return ONLY valid JSON in this exact format, no markdown, no explanation:
{"date":"YYYY-MM-DD","amount":"12345","recipient":"Name","expense_type":"Category"}`;

    try {
        const responseText = await generateWithRetry(base64, prompt, file.type || 'image/jpeg');
        const cleanedText = responseText.trim();

        // Clean up the response - remove markdown code blocks if present
        let jsonStr = cleanedText;
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        // ... existing parsing logic ...
        const parsed = JSON.parse(jsonStr) as OCRResult;

        return {
            date: parsed.date || '',
            amount: parsed.amount?.toString().replace(/[^0-9.]/g, '') || '',
            recipient: parsed.recipient || '',
            expense_type: (parsed.expense_type && ['Fuel', 'Maintenance', 'Salary', 'Miscellaneous'].includes(parsed.expense_type))
                ? parsed.expense_type
                : 'Miscellaneous',
            raw_text: cleanedText
        };
    } catch (error) {
        console.error('Gemini OCR Error:', error);
        throw new Error('Failed to process image with Gemini Vision');
    }
};

/**
 * Scan handwritten text using Gemini Vision
 */
export const scanHandwrittenWithGemini = async (file: File): Promise<string> => {
    const base64 = await fileToBase64(file);

    const prompt = `This image contains handwritten text. Please read and transcribe all the handwritten content you can see. 
Return ONLY the transcribed text, preserving line breaks where appropriate. Do not add explanations or commentary.`;

    try {
        const responseText = await generateWithRetry(base64, prompt, file.type || 'image/jpeg');
        return responseText.trim();
    } catch (error) {
        console.error('Gemini Handwriting OCR Error:', error);
        throw new Error('Failed to process handwritten image');
    }
};

/**
 * Check if Gemini API is available
 */
export const isGeminiAvailable = (): boolean => {
    return !!apiKey;
};

export const scanServiceRequestWithGemini = async (file: File): Promise<ServiceRequestOCRResult> => {
    if (!apiKey) throw new Error('Gemini API Key is missing');

    const base64Data = await fileToBase64(file);

    const prompt = `
      Analyze this handwritten service request / invoice image.
      Extract ALL available information:

      1. Customer Details:
         - customerName: Full name
         - phone: Phone number (digits only)
         - address: Location or address
         - date: Date in YYYY-MM-DD format

      2. Drilling Details (look for depth ranges and rates per ft):
         - drillingDepth: Total drilling depth in feet if mentioned (often unknown, use 0)
         - drillingRate: Base rate per foot for first 300ft (e.g., 70)

      3. Casing Pipe RATES (numbers after 7" or 10" are RATES per ft, not depths):
         - casingRate: 7" casing rate per foot (e.g., "7\" x 250" means rate is 250)
         - casing10Rate: 10" casing rate per foot (e.g., "10\" x 600" means rate is 600)
         Note: casingDepth and casing10Depth are usually unknown, set to 0.

      4. Products/Items (motors, pumps, complete sets, etc.):
         - items: Array of {name, price} for each product mentioned

      Return ONLY valid JSON:
      {
        "customerName": "",
        "phone": "",
        "address": "",
        "date": "",
        "drillingDepth": 0,
        "drillingRate": 0,
        "casingDepth": 0,
        "casingRate": 0,
        "casing10Depth": 0,
        "casing10Rate": 0,
        "items": [{"name": "", "price": 0}],
        "notes": ""
      }
    `;

    // Use the same robust retry/fallback mechanism
    const responseText = await generateWithRetry(base64Data, prompt, file.type || 'image/jpeg');

    try {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText) as ServiceRequestOCRResult;
    } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        return {};
    }
};
