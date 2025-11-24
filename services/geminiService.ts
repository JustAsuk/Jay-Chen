import { GoogleGenAI, Type } from "@google/genai";
import { BoundingBox } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const detectSpritesWithAI = async (base64Image: string): Promise<BoundingBox[]> => {
  try {
    const ai = getAiClient();
    
    // Clean base64 string if it contains headers
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `
      Analyze this sprite sheet image. 
      Identify the bounding boxes for each individual character sprite or animation frame.
      Ignore background noise.
      Return the result as a list of bounding boxes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: "You are a computer vision expert specialized in game development and sprite sheet slicing. Your goal is to accurately detect sprite frames.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sprites: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER, description: "X coordinate of the top-left corner" },
                  y: { type: Type.INTEGER, description: "Y coordinate of the top-left corner" },
                  width: { type: Type.INTEGER, description: "Width of the sprite" },
                  height: { type: Type.INTEGER, description: "Height of the sprite" }
                },
                required: ["x", "y", "width", "height"]
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    const parsed = JSON.parse(jsonText);
    
    if (!parsed.sprites || !Array.isArray(parsed.sprites)) {
        return [];
    }

    return parsed.sprites.map((s: any, index: number) => ({
      id: `ai-${index}-${Date.now()}`,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height
    }));

  } catch (error) {
    console.error("AI Detection Error:", error);
    throw error;
  }
};