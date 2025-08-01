
import { GoogleGenAI, Type } from "@google/genai";
import { Well, ControlType } from '../types';

// This check is to prevent crash in environments where process.env is not defined.
const apiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY
  ? process.env.API_KEY
  : "";

if (!apiKey) {
    console.warn("API_KEY environment variable not set. Gemini API will not be available.");
}

const ai = new GoogleGenAI({ apiKey });

const plateSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "Well ID, e.g., 'A1', 'H12'" },
            compound: { type: Type.STRING, description: "Name of the chemical compound." },
            concentration: { type: Type.NUMBER, description: "Concentration in micromolar (µM)." },
            mw: { type: Type.NUMBER, description: "Molecular Weight of the compound in g/mol. Set to 0 if not applicable." },
            strain: { type: Type.STRING, description: "Biological strain used." },
            controlType: { 
                type: Type.STRING, 
                enum: Object.values(ControlType),
                description: "Type of control." 
            },
            replicateGroup: { type: Type.INTEGER, description: "Identifier for replicate group (0 for none)." },
        },
        required: ["id", "compound", "concentration", "mw", "strain", "controlType", "replicateGroup"],
    },
};

export const generatePlateLayout = async (prompt: string): Promise<Well[]> => {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
    }
    
    const model = 'gemini-2.5-flash';

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Based on the following request, generate a 96-well plate layout. Ensure all 96 wells (A1 to H12) are included in the final JSON array. If a well is not explicitly mentioned, treat it as a blank or empty well (concentration 0, empty strings). For compounds, please provide their molecular weight (MW) in g/mol if it's a known chemical. Request: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: plateSchema,
                systemInstruction: "You are an expert lab assistant specializing in high-throughput screening. Your task is to design 96-well plate layouts based on user requests. You must return a valid JSON array of 96 well objects, matching the provided schema exactly. Do not add any extra commentary or markdown formatting."
            }
        });

        const jsonText = response.text;
        const layout = JSON.parse(jsonText);

        if (!Array.isArray(layout) || layout.length !== 96) {
            throw new Error(`AI returned an invalid plate format. Expected 96 wells, got ${layout.length}.`);
        }
        
        // Additional validation can be done here if needed
        return layout as Well[];

    } catch (error) {
        console.error("Error generating plate layout with Gemini:", error);
        if (error instanceof Error && error.message.includes("API key not valid")) {
             throw new Error("The provided Gemini API key is not valid. Please check your configuration.");
        }
        throw new Error("Failed to generate plate layout from AI. The model may have returned an unexpected format or an error occurred.");
    }
};