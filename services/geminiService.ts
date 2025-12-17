
import { GoogleGenAI } from "@google/genai";
import { Trip } from "../types";

// Always initialize with the named parameter and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTripFraud = async (trip: Trip): Promise<string> => {
  const durationHrs = trip.startTime && trip.endTime 
    ? (trip.endTime - trip.startTime) / (1000 * 60 * 60) 
    : 0;

  const expenseSummary = trip.expenses.map(e => `${e.type}: ₦${e.amount}`).join(', ');
  const pingSummary = trip.pings.map(p => `${p.type} at ${new Date(p.timestamp).toLocaleTimeString()}`).join('\n');

  const prompt = `
    Context: School Bus operations in Lagos, Nigeria.
    Analyze this trip for fraud, efficiency, or anomalies.
    
    Data:
    - Route: ${trip.type}
    - Duration: ${durationHrs.toFixed(2)} hours
    - Est Distance: ${trip.estimatedDistanceKm} km
    - Expenses Claimed: ${expenseSummary || 'None'}
    - Ping Log:
    ${pingSummary}

    Task:
    1. Flag any suspicious expenses (e.g., high fuel cost for short distance).
    2. Comment on time efficiency.
    3. Provide a brief verdict: "Normal" or "Requires Audit".
    
    Keep response concise (under 100 words).
  `;

  try {
    // Using gemini-3-flash-preview for basic text task as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // response.text is a property, not a method.
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Service temporarily unavailable.";
  }
};

export const generateOperationalInsights = async (trips: Trip[]): Promise<string> => {
    // Summarize last 5 trips for context
    const summary = trips.slice(0, 5).map(t => ({
        type: t.type,
        cost: t.expenses.reduce((acc, curr) => acc + curr.amount, 0),
        status: t.status
    }));

    const prompt = `
        Context: School Transport Manager in Nigeria.
        Recent Trips Summary (JSON): ${JSON.stringify(summary)}
        
        Identify 3 key operational improvements or risks based on typical logistics challenges in this region (e.g. fuel theft, traffic delays).
        Format as a bulleted list.
    `;

    try {
        // Using gemini-3-flash-preview for basic text task as per guidelines.
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        // response.text is a property, not a method.
        return response.text || "No insights available.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Could not generate insights.";
    }
}
