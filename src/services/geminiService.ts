import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const analyzeMaintenanceImage = async (base64Image: string) => {
  if (!API_KEY) {
    console.warn("API Key mancante per Gemini");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Extract base64 data if it has the prefix
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png for simplicity from input
              data: base64Data
            }
          },
          {
            text: `Analizza questa immagine relativa a una richiesta di manutenzione stradale o pubblica. 
                   Identifica il problema. 
                   Restituisci un JSON con un titolo breve, una descrizione dettagliata del danno visibile e una categoria suggerita tra: Albero, Guardrail, Strada, Segnaletica, Altro.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            suggestedDescription: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Errore analisi Gemini:", error);
    return null;
  }
};