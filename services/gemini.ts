import { GoogleGenAI } from "@google/genai";
import { ServiceRequest, Product } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing for Gemini");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateCustomerMessage = async (
  request: ServiceRequest,
  products: Product[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key not configured.";

  const itemsList = request.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return `${product?.name || 'Unknown Item'} (x${item.quantity})`;
  }).join(', ');

  const prompt = `
    You are an assistant for "Upasna Borewells".
    Write a professional and polite WhatsApp message to a customer regarding their service request.
    
    Customer Name: ${request.customerName}
    Service Type: ${request.type}
    Date: ${request.date}
    Location: ${request.location}
    Status: ${request.status}
    Items Used: ${itemsList}
    Total Cost: ₹${request.totalCost}
    Notes: ${request.notes}
    
    The message should be concise, thank the customer, summarize the bill, and include the total amount.
    If the status is PENDING, mention we will visit soon.
    If COMPLETED, ask for payment or thank for payment.
    Use emoji where appropriate but keep it professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate message.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate message due to an API error.";
  }
};

export const analyzeBusinessInsights = async (
  requests: ServiceRequest[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key not configured.";

  const dataSummary = requests.map(r => 
    `Date: ${r.date}, Type: ${r.type}, Cost: ${r.totalCost}, Status: ${r.status}`
  ).join('\n');

  const prompt = `
    Analyze the following recent business data for "Upasna Borewells" and provide 3 key short insights or trends.
    Focus on revenue, popular service types, or operational efficiency.
    
    Data:
    ${dataSummary}
    
    Output format:
    1. [Insight 1]
    2. [Insight 2]
    3. [Insight 3]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights.";
  }
};
