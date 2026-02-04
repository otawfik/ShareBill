
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptAnalysis } from "../types";

// Follow @google/genai guidelines for API key and initialization
export class GeminiService {
  /**
   * Analyzes a receipt image using Gemini 3 Pro.
   */
  static async analyzeReceipt(base64Image: string): Promise<ReceiptAnalysis> {
    // ALWAYS use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: "Extract all items from this receipt including name and price. Also find the subtotal, tax, tip, and total. If tip is not visible, return 0. Use a JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                },
                required: ["id", "name", "price"],
              },
            },
            subtotal: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            tip: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            currency: { type: Type.STRING },
          },
          required: ["items", "subtotal", "total"],
        },
      },
    });

    try {
      // response.text is a property, not a method.
      const text = response.text || "{}";
      const result = JSON.parse(text);
      
      // Ensure robust data for the UI
      return {
        items: (result.items || []).map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(36).substr(2, 9)
        })),
        subtotal: result.subtotal || 0,
        tax: result.tax || 0,
        tip: result.tip || 0,
        total: result.total || 0,
        currency: result.currency || '$'
      };
    } catch (e) {
      console.error("Failed to parse receipt analysis", e);
      throw new Error("Could not read the receipt clearly. Please try again.");
    }
  }

  /**
   * Edits a receipt image using Gemini 2.5 Flash Image.
   */
  static async editImage(base64Image: string, prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Extract image from response parts
    const candidates = response.candidates || [];
    const parts = candidates[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Image generation failed.");
  }
}
