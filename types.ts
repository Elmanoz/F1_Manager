export interface Driver {
  id: string;
  name: string;
  team: string;
  nationality: string;
  rating: number; // 0-100
  cost: number; // in millions
  developmentPoints: number; // Experience available to spend
  contractExpiryYear: number; // The year the driver's current contract ends
  stats: {
    wins: number;
    podiums: number;
    poles: number;
    points: number;
    championships: number;
  };
}

export interface Track {
  name: string;
  location: string;
  laps: number;
  difficulty: 'Low' | 'Medium' | 'High';
  characteristics: string;
}

export interface RaceResult {
  position: number;
  driverName: string;
  team: string;
  gap: string;
  points: number;
}

export interface SimulationLog {
  lap: number;
  event: string;
  type: 'overtake' | 'crash' | 'pitstop' | 'info' | 'issue';
}

export interface RaceSimulationResponse {
  classification: RaceResult[];
  commentary: SimulationLog[];
  summary: string;
}

// --- NEW DEVELOPMENT TYPES ---

export type PartCategory = 'Aerodynamics' | 'Chassis' | 'Powertrain' | 'Reliability';

export interface CarPart {
  id: string;
  name: string;
  category: PartCategory;
  level: number;
  maxLevel: number;
  baseCost: number;
  description: string;
  statEffect: string; // Description for UI
}

export interface TeamFacilities {
  pitCrew: number;      // 1-10
  simulator: number;    // 1-10 (Boosts XP gain)
  factory: number;      // 1-10 (Reduces upgrade costs)
}

// --- NEW SETUP & QUALI TYPES ---

export interface CarSetup {
  frontWing: number; // 0-100 (Angle)
  rearWing: number;  // 0-100 (Angle)
  suspension: number; // 0-100 (Soft to Stiff)
  gearing: number; // 0-100 (Short to Long)
}

export interface GameState {
  teamName: string;
  teamPrincipal: string;
  teamColors: { primary: string; secondary: string };
  budget: number;
  drivers: Driver[]; 
  availableDrivers: Driver[];
  currentTrack: Track | null;
  seasonPoints: number;
  raceHistory: RaceSimulationResponse[];
  
  // New Structures
  carParts: Record<string, CarPart>;
  facilities: TeamFacilities;
  
  // Session State
  currentSetup: Record<string, CarSetup>; // Map DriverID -> Setup
  setupConfidence: Record<string, number>; // Map DriverID -> Confidence (0.0 - 1.0)
  qualifyingResults: Driver[]; // Sorted array for grid
}

export enum GamePhase {
  MAIN_MENU = 'MAIN_MENU',
  SETUP = 'SETUP',
  MARKET = 'MARKET',
  HQ = 'HQ',
  PRACTICE = 'PRACTICE', // New
  QUALIFYING = 'QUALIFYING', // New
  PRE_RACE = 'PRE_RACE',
  SIMULATING = 'SIMULATING',
  POST_RACE = 'POST_RACE'
}

// --- LIVE RACE TYPES ---

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD';
export type PaceMode = 'CONSERVE' | 'BALANCED' | 'PUSH';

export interface RaceScenario {
  baseLapTime: number; // In milliseconds
  degradationRate: number; // Multiplier
  weatherCondition: 'Dry' | 'Mixed' | 'Wet';
  rainProbability: number;
  opponents: Driver[];
  optimalSetup: CarSetup; // Hidden target for practice
}

export interface LiveCarState {
  driverId: string;
  driverName: string;
  team: string;
  isPlayer: boolean;
  color: string;
  rating: number; // Driver skill rating for physics
  
  // Dynamic State
  lap: number;
  progress: number; // 0.0 to 100.0 (percentage of lap)
  tireHealth: number; // 0-100
  tireCompound: TireCompound;
  paceMode: PaceMode;
  isPitting: boolean;
  pitStopDuration: number; // countdown
  
  // Mechanical Issue State
  hasIssue: boolean;
  issueType?: string;
  performancePenalty: number; // 0.0 to 1.0 (multiplier on speed)
  
  // Stats
  position: number;
  lastLapTime: number;
  currentLapDuration: number; // Time spent in current lap
  lapHistory: number[]; // Array of completed lap times
  gapToLeader: number;
  projectedLapTime: number; // Estimated lap time in ms based on current pace
  
  // Strategy
  scheduledStops?: { lap: number; compound: TireCompound }[];
}