import React, { useState, useEffect } from 'react';
import { GamePhase, GameState, Driver, RaceSimulationResponse, CarPart, TeamFacilities, CarSetup, Track, RaceScenario } from './types';
import DriverMarket from './components/DriverMarket';
import RaceControl from './components/RaceControl';
import RaceResults from './components/RaceResults';
import TeamHQ from './components/TeamHQ';
import MainMenu from './components/MainMenu';
import TeamSetup from './components/TeamSetup';
import PracticeSession from './components/PracticeSession';
import QualifyingSession from './components/QualifyingSession';
import { fetchTrackIntel, generateRaceScenario } from './services/geminiService';

// Initial Configuration for a new game
const INITIAL_PARTS: Record<string, CarPart> = {
  'frontWing': { id: 'frontWing', name: 'Front Wing', category: 'Aerodynamics', level: 1, maxLevel: 10, baseCost: 2, description: 'Primary downforce generator.', statEffect: '+Cornering Speed' },
  'rearWing': { id: 'rearWing', name: 'Rear Wing', category: 'Aerodynamics', level: 1, maxLevel: 10, baseCost: 2, description: 'Balances drag and downforce.', statEffect: '+High Speed Grip' },
  'floor': { id: 'floor', name: 'Underfloor', category: 'Aerodynamics', level: 1, maxLevel: 10, baseCost: 4, description: 'Ground effect generation.', statEffect: '++Overall Grip' },
  'suspension': { id: 'suspension', name: 'Suspension', category: 'Chassis', level: 1, maxLevel: 10, baseCost: 2, description: 'Mechanical grip and stability.', statEffect: '-Tire Wear' },
  'chassis': { id: 'chassis', name: 'Monocoque', category: 'Chassis', level: 1, maxLevel: 10, baseCost: 5, description: 'Core structural rigidity.', statEffect: '++Stability' },
  'brakes': { id: 'brakes', name: 'Brake Ducts', category: 'Chassis', level: 1, maxLevel: 10, baseCost: 1, description: 'Stopping power and cooling.', statEffect: '+Overtaking' },
  'engine': { id: 'engine', name: 'ICE Unit', category: 'Powertrain', level: 1, maxLevel: 10, baseCost: 5, description: 'Internal Combustion Engine.', statEffect: '++Top Speed' },
  'ers': { id: 'ers', name: 'ERS System', category: 'Powertrain', level: 1, maxLevel: 10, baseCost: 3, description: 'Energy Recovery System.', statEffect: '+Acceleration' },
  'gearbox': { id: 'gearbox', name: 'Gearbox', category: 'Reliability', level: 1, maxLevel: 10, baseCost: 2, description: 'Transmission durability.', statEffect: '-Failure Chance' },
  'cooling': { id: 'cooling', name: 'Radiators', category: 'Reliability', level: 1, maxLevel: 10, baseCost: 2, description: 'Temperature management.', statEffect: '-Overheating' },
};

const INITIAL_FACILITIES: TeamFacilities = {
  pitCrew: 1,
  simulator: 1,
  factory: 1
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MAIN_MENU);
  const [gameState, setGameState] = useState<GameState>({
    teamName: '',
    teamPrincipal: '',
    teamColors: { primary: '#e10600', secondary: '#ffffff' },
    budget: 85, 
    drivers: [],
    availableDrivers: [],
    currentTrack: null,
    seasonPoints: 0,
    raceHistory: [],
    carParts: INITIAL_PARTS,
    facilities: INITIAL_FACILITIES,
    currentSetup: {},
    setupConfidence: {},
    qualifyingResults: []
  });
  const [hasSave, setHasSave] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<RaceScenario | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('f1ManagerSave');
    if (saved) setHasSave(true);
  }, []);

  useEffect(() => {
    if (phase !== GamePhase.MAIN_MENU && phase !== GamePhase.SETUP) {
      const savePacket = { phase, gameState };
      localStorage.setItem('f1ManagerSave', JSON.stringify(savePacket));
      setHasSave(true);
    }
  }, [phase, gameState]);

  const handleNewGame = () => {
    setGameState({
      teamName: '',
      teamPrincipal: '',
      teamColors: { primary: '#e10600', secondary: '#ffffff' },
      budget: 85,
      drivers: [],
      availableDrivers: [],
      currentTrack: null,
      seasonPoints: 0,
      raceHistory: [],
      carParts: JSON.parse(JSON.stringify(INITIAL_PARTS)),
      facilities: { ...INITIAL_FACILITIES },
      currentSetup: {},
      setupConfidence: {},
      qualifyingResults: []
    });
    setPhase(GamePhase.SETUP);
  };

  const handleLoadGame = () => {
    const saved = localStorage.getItem('f1ManagerSave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.gameState.carParts) {
           parsed.gameState.carParts = JSON.parse(JSON.stringify(INITIAL_PARTS));
           parsed.gameState.facilities = { ...INITIAL_FACILITIES };
        }
        setGameState(parsed.gameState);
        const safePhase = (parsed.phase === GamePhase.SIMULATING) ? GamePhase.PRE_RACE : parsed.phase;
        setPhase(safePhase);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  };

  const handleTeamSetupComplete = (name: string, principal: string, colors: { primary: string; secondary: string }, drivers?: Driver[]) => {
    let newBudget = 85;
    if (drivers && drivers.length > 0) {
      const driverCost = drivers.reduce((acc, d) => acc + d.cost, 0);
      newBudget -= driverCost;
    }

    setGameState(prev => ({ 
      ...prev, 
      teamName: name, 
      teamPrincipal: principal,
      teamColors: colors,
      drivers: drivers || [],
      budget: newBudget
    }));

    if (drivers && drivers.length === 2) {
      setPhase(GamePhase.HQ);
    } else {
      setPhase(GamePhase.MARKET);
    }
  };

  const hireDrivers = (selectedDrivers: Driver[]) => {
    const cost = selectedDrivers.reduce((sum, d) => sum + d.cost, 0);
    setGameState(prev => ({
      ...prev,
      drivers: selectedDrivers,
      budget: prev.budget - cost
    }));
    setPhase(GamePhase.HQ);
  };

  const handleUpgradePart = (partId: string, cost: number) => {
    setGameState(prev => {
      if (prev.budget < cost) return prev;
      const part = prev.carParts[partId];
      if (!part || part.level >= part.maxLevel) return prev;
      return {
        ...prev,
        budget: prev.budget - cost,
        carParts: { ...prev.carParts, [partId]: { ...part, level: part.level + 1 } }
      };
    });
  };

  const handleUpgradeFacility = (type: keyof TeamFacilities, cost: number) => {
    setGameState(prev => {
      if (prev.budget < cost) return prev;
      return {
        ...prev,
        budget: prev.budget - cost,
        facilities: { ...prev.facilities, [type]: prev.facilities[type] + 1 }
      };
    });
  };

  const handleTrainDriver = (driverId: string) => {
    setGameState(prev => {
      const drivers = prev.drivers.map(d => {
        if (d.id === driverId) {
          const costToUpgrade = 500 * Math.pow(1.05, d.rating - 70); 
          const costRounded = Math.ceil(costToUpgrade / 10) * 10;
          if (d.developmentPoints >= costRounded && d.rating < 99) {
            return { ...d, rating: d.rating + 1, developmentPoints: d.developmentPoints - costRounded };
          }
        }
        return d;
      });
      return { ...prev, drivers };
    });
  };

  const handleRaceComplete = (result: RaceSimulationResponse) => {
    const myDriverIds = gameState.drivers.map(d => d.id);
    let totalPointsGained = 0;
    const simulatorMultiplier = 1 + ((gameState.facilities.simulator || 1) - 1) * 0.1;

    const updatedDrivers = gameState.drivers.map(d => {
      const raceRes = result.classification.find(r => r.driverName === d.name);
      
      // 1. Calculate Experience Gained
      let earnedDP = 50 * simulatorMultiplier; 
      if (raceRes) {
         const positionBonus = (21 - raceRes.position) * 15;
         earnedDP += positionBonus * simulatorMultiplier;
      }

      // 2. Update Career Statistics
      const newStats = { ...d.stats };
      if (raceRes) {
        newStats.points += raceRes.points;
        totalPointsGained += raceRes.points;
        if (raceRes.position === 1) newStats.wins += 1;
        if (raceRes.position <= 3) newStats.podiums += 1;
      }

      // 3. Update Poles (from Qualifying)
      if (gameState.qualifyingResults.length > 0 && gameState.qualifyingResults[0].id === d.id) {
        newStats.poles += 1;
      }

      return { 
        ...d, 
        developmentPoints: Math.floor(d.developmentPoints + earnedDP),
        stats: newStats
      };
    });

    const prizeMoney = 2 + Math.floor(totalPointsGained * 0.5);

    setGameState(prev => ({
      ...prev,
      seasonPoints: prev.seasonPoints + totalPointsGained,
      budget: prev.budget + prizeMoney,
      raceHistory: [...prev.raceHistory, result],
      drivers: updatedDrivers,
      currentSetup: {},
      setupConfidence: {},
      qualifyingResults: []
    }));

    setPhase(GamePhase.POST_RACE);
    setCurrentScenario(null);
  };

  const prepareRaceWeekend = async () => {
    setPhase(GamePhase.PRACTICE);
    try {
      const raceIndex = gameState.raceHistory.length;
      const track = await fetchTrackIntel(raceIndex);
      setGameState(prev => ({ ...prev, currentTrack: track }));
      const scenario = await generateRaceScenario(track, gameState.drivers);
      setCurrentScenario(scenario);
    } catch (error) {
      console.error("Failed to prepare race weekend", error);
    }
  };

  const handlePracticeComplete = (setups: Record<string, CarSetup>, confidence: Record<string, number>) => {
     setGameState(prev => ({ ...prev, currentSetup: setups, setupConfidence: confidence }));
     setPhase(GamePhase.QUALIFYING);
  };

  const handleQualifyingComplete = (grid: Driver[]) => {
     setGameState(prev => ({ ...prev, qualifyingResults: grid }));
     setPhase(GamePhase.PRE_RACE);
  };

  const goToHQ = () => setPhase(GamePhase.HQ);
  const goToMainMenu = () => setPhase(GamePhase.MAIN_MENU);

  if (phase === GamePhase.MAIN_MENU) {
    return <MainMenu onNewGame={handleNewGame} onLoadGame={handleLoadGame} hasSave={hasSave} />;
  }

  const currentRound = gameState.raceHistory.length + 1;

  return (
    <div className="min-h-screen bg-racing-black text-slate-300 font-sans">
      <header className="fixed w-full top-0 z-50 bg-racing-black border-b-[2px] border-racing-panel shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={goToMainMenu}>
            <div className="flex gap-1 h-6">
              <div className="w-12 bg-f1-red skew-x-[20deg] rounded-sm"></div>
              <div className="w-4 bg-f1-red skew-x-[20deg] rounded-sm"></div>
            </div>
            <div className="h-4 w-[1px] bg-slate-800 mx-2"></div>
            <h1 className="text-white font-display font-bold text-xl italic tracking-tighter group-hover:text-f1-red transition-colors">
              MANAGER <span className="font-light text-slate-500">2026</span>
            </h1>
          </div>

          {phase !== GamePhase.SETUP && (
            <div className="flex items-center gap-8 text-white font-bold text-sm">
              {phase !== GamePhase.MARKET && (
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Round {currentRound}/24</span>
                  <span className="text-slate-300">{gameState.currentTrack?.name || "PRE-SEASON"}</span>
                </div>
              )}
              
              <div className="flex gap-6 border-l border-slate-800 pl-6">
                 <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider">Team</span>
                    <span className="text-slate-200">{gameState.teamName}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider">Points</span>
                    <span className="text-slate-200">{gameState.seasonPoints}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider">Budget</span>
                    <span className="text-racing-neon">${gameState.budget}M</span>
                 </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen">
        {phase === GamePhase.SETUP && (
           <div className="flex items-center justify-center min-h-[80vh]">
               <TeamSetup onComplete={handleTeamSetupComplete} />
           </div>
        )}

        {phase === GamePhase.MARKET && (
          <DriverMarket onHire={hireDrivers} budget={gameState.budget} />
        )}

        {phase === GamePhase.HQ && (
          <TeamHQ 
            carParts={gameState.carParts}
            facilities={gameState.facilities}
            budget={gameState.budget}
            drivers={gameState.drivers}
            onUpgradePart={handleUpgradePart}
            onUpgradeFacility={handleUpgradeFacility}
            onTrainDriver={handleTrainDriver}
            onNext={prepareRaceWeekend}
            gameState={gameState} 
          />
        )}

        {phase === GamePhase.PRACTICE && !currentScenario && (
           <div className="flex flex-col items-center justify-center h-[70vh]">
             <div className="w-16 h-16 border-4 border-f1-red border-t-transparent rounded-full animate-spin mb-6"></div>
             <h2 className="text-2xl font-bold uppercase text-white">Travelling to {gameState.currentTrack?.location || 'Circuit'}</h2>
             <p className="text-slate-500 mt-2 font-mono">Simulating Logistics...</p>
           </div>
        )}

        {phase === GamePhase.PRACTICE && currentScenario && gameState.currentTrack && (
           <PracticeSession
             drivers={gameState.drivers}
             track={gameState.currentTrack}
             scenario={currentScenario}
             onComplete={handlePracticeComplete}
           />
        )}

        {phase === GamePhase.QUALIFYING && currentScenario && gameState.currentTrack && (
           <QualifyingSession
             drivers={gameState.drivers}
             opponents={currentScenario.opponents}
             track={gameState.currentTrack}
             setupConfidence={gameState.setupConfidence}
             onComplete={handleQualifyingComplete}
           />
        )}

        {phase === GamePhase.PRE_RACE && (
          <RaceControl 
            drivers={gameState.drivers} 
            carParts={gameState.carParts} 
            facilities={gameState.facilities}
            raceIndex={gameState.raceHistory.length}
            onRaceComplete={handleRaceComplete}
            teamColors={gameState.teamColors}
            gridOrder={gameState.qualifyingResults}
            setupConfidence={gameState.setupConfidence}
          />
        )}

        {phase === GamePhase.POST_RACE && gameState.raceHistory.length > 0 && (
          <RaceResults 
            results={gameState.raceHistory[gameState.raceHistory.length - 1]} 
            myDrivers={gameState.drivers}
            onNextRace={goToHQ}
          />
        )}
      </main>
    </div>
  );
};

export default App;