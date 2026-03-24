import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Driver, Track, RaceScenario } from "../types";

// Initialize the client. 
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const DRIVERS_2026: Driver[] = [
  // Red Bull Racing
  { 
    id: 'ver', name: 'Max Verstappen', team: 'Red Bull Racing', nationality: 'Dutch', rating: 99, cost: 50, developmentPoints: 0, contractExpiryYear: 2028,
    stats: { wins: 62, podiums: 111, poles: 40, points: 2950, championships: 4 }
  },
  { 
    id: 'law', name: 'Liam Lawson', team: 'Red Bull Racing', nationality: 'New Zealander', rating: 82, cost: 15, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 0, podiums: 0, poles: 0, points: 2, championships: 0 }
  },
  // McLaren
  { 
    id: 'nor', name: 'Lando Norris', team: 'McLaren', nationality: 'British', rating: 96, cost: 45, developmentPoints: 0, contractExpiryYear: 2027,
    stats: { wins: 3, podiums: 25, poles: 8, points: 900, championships: 0 }
  },
  { 
    id: 'pia', name: 'Oscar Piastri', team: 'McLaren', nationality: 'Australian', rating: 93, cost: 40, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 2, podiums: 15, poles: 0, points: 400, championships: 0 }
  },
  // Ferrari
  { 
    id: 'lec', name: 'Charles Leclerc', team: 'Ferrari', nationality: 'Monegasque', rating: 95, cost: 48, developmentPoints: 0, contractExpiryYear: 2029,
    stats: { wins: 8, podiums: 40, poles: 26, points: 1300, championships: 0 }
  },
  { 
    id: 'ham', name: 'Lewis Hamilton', team: 'Ferrari', nationality: 'British', rating: 94, cost: 42, developmentPoints: 0, contractExpiryYear: 2027,
    stats: { wins: 105, podiums: 201, poles: 104, points: 4800, championships: 7 }
  },
  // Mercedes
  { 
    id: 'rus', name: 'George Russell', team: 'Mercedes', nationality: 'British', rating: 92, cost: 38, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 2, podiums: 14, poles: 3, points: 600, championships: 0 }
  },
  { 
    id: 'ant', name: 'Andrea Kimi Antonelli', team: 'Mercedes', nationality: 'Italian', rating: 80, cost: 12, developmentPoints: 0, contractExpiryYear: 2028,
    stats: { wins: 0, podiums: 0, poles: 0, points: 0, championships: 0 }
  },
  // Aston Martin
  { 
    id: 'alo', name: 'Fernando Alonso', team: 'Aston Martin', nationality: 'Spanish', rating: 90, cost: 30, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 32, podiums: 107, poles: 22, points: 2320, championships: 2 }
  },
  { 
    id: 'str', name: 'Lance Stroll', team: 'Aston Martin', nationality: 'Canadian', rating: 78, cost: 10, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 0, podiums: 3, poles: 1, points: 290, championships: 0 }
  },
  // Alpine
  { 
    id: 'gas', name: 'Pierre Gasly', team: 'Alpine', nationality: 'French', rating: 84, cost: 20, developmentPoints: 0, contractExpiryYear: 2027,
    stats: { wins: 1, podiums: 5, poles: 0, points: 420, championships: 0 }
  },
  { 
    id: 'col', name: 'Franco Colapinto', team: 'Alpine', nationality: 'Argentinan', rating: 80, cost: 8, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 0, podiums: 0, poles: 0, points: 5, championships: 0 }
  },
  // Williams
  { 
    id: 'sai', name: 'Carlos Sainz', team: 'Williams', nationality: 'Spanish', rating: 89, cost: 32, developmentPoints: 0, contractExpiryYear: 2027,
    stats: { wins: 4, podiums: 26, poles: 5, points: 1200, championships: 0 }
  },
  { 
    id: 'alb', name: 'Alexander Albon', team: 'Williams', nationality: 'Thai', rating: 86, cost: 25, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 0, podiums: 2, poles: 0, points: 240, championships: 0 }
  },
  // RB
  { 
    id: 'tsu', name: 'Yuki Tsunoda', team: 'RB', nationality: 'Japanese', rating: 83, cost: 18, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 0, podiums: 0, poles: 0, points: 85, championships: 0 }
  },
  { 
    id: 'had', name: 'Isack Hadjar', team: 'RB', nationality: 'French', rating: 75, cost: 7, developmentPoints: 0, contractExpiryYear: 2027,
    stats: { wins: 0, podiums: 0, poles: 0, points: 0, championships: 0 }
  },
  // Audi 
  { 
    id: 'hul', name: 'Nico Hulkenberg', team: 'Audi', nationality: 'German', rating: 82, cost: 16, developmentPoints: 0, contractExpiryYear: 2027,
    stats: { wins: 0, podiums: 0, poles: 1, points: 560, championships: 0 }
  },
  { 
    id: 'bor', name: 'Gabriel Bortoleto', team: 'Audi', nationality: 'Brazilian', rating: 77, cost: 10, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 0, podiums: 0, poles: 0, points: 0, championships: 0 }
  },
  // Haas
  { 
    id: 'oco', name: 'Esteban Ocon', team: 'Haas', nationality: 'French', rating: 81, cost: 18, developmentPoints: 0, contractExpiryYear: 2027,
    stats: { wins: 1, podiums: 4, poles: 0, points: 450, championships: 0 }
  },
  { 
    id: 'bea', name: 'Oliver Bearman', team: 'Haas', nationality: 'British', rating: 79, cost: 12, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 0, podiums: 0, poles: 0, points: 6, championships: 0 }
  },
  // Cadillac 
  { 
    id: 'bot', name: 'Valtteri Bottas', team: 'Cadillac', nationality: 'Finnish', rating: 85, cost: 20, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 10, podiums: 67, poles: 20, points: 1800, championships: 0 }
  },
  { 
    id: 'per', name: 'Sergio Perez', team: 'Cadillac', nationality: 'Mexican', rating: 84, cost: 14, developmentPoints: 0, contractExpiryYear: 2026,
    stats: { wins: 6, podiums: 39, poles: 3, points: 1600, championships: 0 }
  }
];

const CALENDAR_2026 = [
  "Bahrain International Circuit (Sakhir)",
  "Jeddah Corniche Circuit (Saudi Arabia)",
  "Albert Park Circuit (Melbourne)",
  "Suzuka Circuit (Japan)",
  "Shanghai International Circuit (China)",
  "Miami International Autodrome (USA)",
  "Imola Circuit (Emilia Romagna)",
  "Circuit de Monaco (Monaco)",
  "Madrid Street Circuit (Spain)", 
  "Circuit Gilles Villeneuve (Canada)",
  "Red Bull Ring (Austria)",
  "Silverstone Circuit (UK)",
  "Hungaroring (Hungary)",
  "Circuit de Spa-Francorchamps (Belgium)",
  "Circuit Zandvoort (Netherlands)",
  "Monza Circuit (Italy)",
  "Baku City Circuit (Azerbaijan)",
  "Marina Bay Street Circuit (Singapore)",
  "Circuit of the Americas (Austin)",
  "Autódromo Hermanos Rodríguez (Mexico)",
  "Interlagos Circuit (Brazil)",
  "Las Vegas Strip Circuit (USA)",
  "Lusail International Circuit (Qatar)",
  "Yas Marina Circuit (Abu Dhabi)"
];

export const fetchRealDrivers = async (): Promise<Driver[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...DRIVERS_2026]);
    }, 600);
  });
};

export const fetchTrackIntel = async (raceIndex: number): Promise<Track> => {
  const modelId = "gemini-3-flash-preview";
  const trackName = CALENDAR_2026[raceIndex % CALENDAR_2026.length];
  
  const prompt = `
    Provide details for the following Formula 1 track: "${trackName}".
    This is for the 2026 season.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      location: { type: Type.STRING },
      laps: { type: Type.INTEGER },
      difficulty: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
      characteristics: { type: Type.STRING },
    },
    required: ["name", "location", "laps", "difficulty", "characteristics"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    return JSON.parse(response.text || "{}") as Track;
  } catch (error) {
    console.error("Track fetch failed", error);
    return { name: trackName, location: "Unknown", laps: 50, difficulty: "Medium", characteristics: "Standard circuit." };
  }
};

export const generateRaceScenario = async (
  track: Track, 
  myDrivers: Driver[]
): Promise<RaceScenario> => {
  const modelId = "gemini-3-pro-preview";
  const myDriverIds = new Set(myDrivers.map(d => d.id));
  const opponents = DRIVERS_2026.filter(d => !myDriverIds.has(d.id));

  const prompt = `
    Analyze the Formula 1 track: ${track.name} (${track.characteristics}).
    
    Task:
    1. Determine a realistic base lap time in milliseconds (e.g., 90000 for 1:30.000).
    2. Determine the tire degradation rate (1.0 is standard, 1.5 is high wear).
    3. Determine the weather condition and rain probability based on the location's typical climate.
    4. Determine the OPTIMAL car setup (0-100 scale) for:
       - frontWing (0=Low Downforce, 100=Max Downforce)
       - rearWing (0=Low Drag, 100=Max Grip)
       - suspension (0=Soft/Mech Grip, 100=Stiff/Responsive)
       - gearing (0=Short/Acceleration, 100=Long/Top Speed)
    
    Return JSON.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      baseLapTime: { type: Type.INTEGER },
      degradationRate: { type: Type.NUMBER },
      weatherCondition: { type: Type.STRING, enum: ["Dry", "Mixed", "Wet"] },
      rainProbability: { type: Type.INTEGER },
      optimalSetup: {
        type: Type.OBJECT,
        properties: {
          frontWing: { type: Type.INTEGER },
          rearWing: { type: Type.INTEGER },
          suspension: { type: Type.INTEGER },
          gearing: { type: Type.INTEGER },
        },
        required: ["frontWing", "rearWing", "suspension", "gearing"]
      }
    },
    required: ["baseLapTime", "degradationRate", "weatherCondition", "rainProbability", "optimalSetup"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, 
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const data = JSON.parse(response.text || "{}");
    if (!data.optimalSetup) {
       data.optimalSetup = { frontWing: 50, rearWing: 50, suspension: 50, gearing: 50 };
    }
    return { ...data, opponents: opponents } as RaceScenario;
  } catch (error) {
    console.error("Scenario generation failed:", error);
    return {
      baseLapTime: 90000,
      degradationRate: 1.0,
      weatherCondition: "Dry",
      rainProbability: 0,
      opponents: opponents,
      optimalSetup: { frontWing: 50, rearWing: 50, suspension: 50, gearing: 50 }
    };
  }
};