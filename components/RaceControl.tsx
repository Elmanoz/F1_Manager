import React, { useState, useEffect, useRef } from 'react';
import { Driver, Track, RaceSimulationResponse, LiveCarState, RaceScenario, PaceMode, TireCompound, RaceResult, SimulationLog, CarPart, TeamFacilities } from '../types';
import { generateRaceScenario, fetchTrackIntel, DRIVERS_2026 } from '../services/geminiService';

interface RaceControlProps {
  drivers: Driver[];
  carParts: Record<string, CarPart>;
  facilities: TeamFacilities;
  raceIndex: number;
  onRaceComplete: (result: RaceSimulationResponse) => void;
  autoStart?: boolean;
  teamColors?: { primary: string; secondary: string };
  gridOrder?: Driver[]; 
  setupConfidence?: Record<string, number>;
}

const TIRE_STATS: Record<TireCompound, { speed: number; wear: number; color: string; label: string; desc: string }> = {
  SOFT: { speed: 1.05, wear: 1.8, color: '#ef4444', label: 'S', desc: 'Sprint / High Wear' },
  MEDIUM: { speed: 1.0, wear: 1.0, color: '#eab308', label: 'M', desc: 'Balanced' },
  HARD: { speed: 0.96, wear: 0.5, color: '#f3f4f6', label: 'H', desc: 'Marathon / Durable' }
};

const PACE_CONFIG: Record<PaceMode, { label: string; color: string; icon: string }> = {
  PUSH: { label: 'Push', color: 'bg-racing-red', icon: '🔥' },
  BALANCED: { label: 'Balanced', color: 'bg-racing-neon', icon: '⚖️' },
  CONSERVE: { label: 'Conserve', color: 'bg-green-500', icon: '🍃' }
};

interface PitStopStrategy {
  lap: number;
  compound: TireCompound;
}

interface DriverStrategy {
  startingCompound: TireCompound;
  pitStops: PitStopStrategy[];
}

const RaceControl: React.FC<RaceControlProps> = ({ 
  drivers, 
  carParts, 
  facilities, 
  raceIndex, 
  onRaceComplete, 
  autoStart, 
  teamColors,
  gridOrder,
  setupConfidence
}) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [scenario, setScenario] = useState<RaceScenario | null>(null);
  const [racePhase, setRacePhase] = useState<'LOADING' | 'STRATEGY' | 'RACING' | 'FINISHED'>('LOADING');
  const [isPaused, setIsPaused] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [playerStrategies, setPlayerStrategies] = useState<Record<string, DriverStrategy>>({});
  const [trackTemp, setTrackTemp] = useState(30); 
  const [trackGrip, setTrackGrip] = useState(1.0); 
  const [currentLap, setCurrentLap] = useState(1);
  const [cars, setCars] = useState<LiveCarState[]>([]);
  const [events, setEvents] = useState<SimulationLog[]>([]);
  const [selectedDriverForStats, setSelectedDriverForStats] = useState<string | null>(null);
  const [selectedDriverForStrategy, setSelectedDriverForStrategy] = useState<string | null>(null);

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const raceFinishedRef = useRef(false);
  const raceEnvRef = useRef({ temp: 30, grip: 1.0, weather: 'Dry' });

  const calculateCarStats = () => {
    const getCatLevel = (cat: string) => {
       const parts = (Object.values(carParts) as CarPart[]).filter(p => p.category === cat);
       if (parts.length === 0) return 1;
       const avg = parts.reduce((sum, p) => sum + p.level, 0) / parts.length;
       return avg;
    };
    return {
      aero: getCatLevel('Aerodynamics'),
      chassis: getCatLevel('Chassis'),
      power: getCatLevel('Powertrain'),
      reliability: getCatLevel('Reliability'),
    };
  };

  useEffect(() => {
    const init = async () => {
      setRacePhase('LOADING');
      const t = await fetchTrackIntel(raceIndex);
      setTrack(t);
      const s = await generateRaceScenario(t, drivers);
      setScenario(s);
      const initialStrategies: Record<string, DriverStrategy> = {};
      drivers.forEach(d => initialStrategies[d.id] = { startingCompound: 'MEDIUM', pitStops: [] });
      setPlayerStrategies(initialStrategies);
      if (autoStart) {
        startRace(s, initialStrategies, t);
      } else {
        setRacePhase('STRATEGY');
      }
    };
    init();
  }, [raceIndex, drivers, autoStart]);

  const startRace = (scen: RaceScenario, strategies: Record<string, DriverStrategy>, trk: Track) => {
    const initialCars: LiveCarState[] = [];
    raceFinishedRef.current = false;
    const startTemp = scen.weatherCondition === 'Wet' ? 22 : 35;
    const startGrip = scen.weatherCondition === 'Wet' ? 0.70 : 0.88; 
    raceEnvRef.current = { temp: startTemp, grip: startGrip, weather: scen.weatherCondition };
    setTrackTemp(startTemp);
    setTrackGrip(startGrip);
    
    let startingGrid: Driver[] = [];
    if (gridOrder && gridOrder.length > 0) {
      startingGrid = gridOrder;
    } else {
      const opps = scen.opponents;
      const all = [...drivers, ...opps];
      startingGrid = all.sort(() => Math.random() - 0.5);
    }

    startingGrid.forEach((d, idx) => {
       const isPlayer = drivers.some(pd => pd.id === d.id);
       const carColor = isPlayer 
         ? (d.id === drivers[0].id ? teamColors?.primary || '#ef4444' : teamColors?.secondary || '#fbbf24')
         : '#ffffff';
       const strategy = isPlayer ? strategies[d.id].startingCompound : (idx < 6 ? 'SOFT' : idx > 14 ? 'HARD' : 'MEDIUM');
       const scheduledStops = isPlayer ? strategies[d.id].pitStops : [];

       initialCars.push({
        driverId: d.id,
        driverName: d.name,
        team: d.team,
        isPlayer: isPlayer,
        color: carColor, 
        rating: d.rating,
        lap: 1,
        progress: 0 - (idx * 0.5), 
        tireHealth: 100,
        tireCompound: strategy,
        paceMode: 'BALANCED',
        isPitting: false,
        pitStopDuration: 0,
        position: idx + 1, 
        lastLapTime: 0,
        currentLapDuration: 0,
        lapHistory: [],
        gapToLeader: 0,
        projectedLapTime: scen.baseLapTime,
        hasIssue: false,
        performancePenalty: 0,
        scheduledStops: scheduledStops
       });
    });
    setCars(initialCars);
    setRacePhase('RACING');
  };

  const updateGame = (time: number) => {
    if (lastTimeRef.current !== undefined && racePhase === 'RACING' && !isPaused && track && scenario && !raceFinishedRef.current) {
      const deltaTime = time - lastTimeRef.current;
      const safeDelta = Math.min(deltaTime, 100);
      const steps = Math.ceil((safeDelta / 16) * gameSpeed); 
      const simulatedTimePassed = safeDelta * gameSpeed;
      const env = raceEnvRef.current;
      if (env.weather === 'Dry' && env.grip < 1.05) env.grip += (1.06 - env.grip) * 0.0008 * steps; 
      else if (env.weather !== 'Dry' && env.grip > 0.65) env.grip -= 0.001 * steps;
      const tempDrift = (Math.random() - 0.5) * 0.02 * steps;
      env.temp = Math.max(15, Math.min(50, env.temp + tempDrift));
      setTrackGrip(env.grip);
      setTrackTemp(env.temp);
      const teamStats = calculateCarStats();
      setCars(prevCars => {
        const nextCars = prevCars.map((car, idx) => {
           const c = { ...car };
           if (!c.isPitting && c.lap <= track.laps) {
             c.currentLapDuration += simulatedTimePassed;
           }
           if (c.isPitting) {
             c.pitStopDuration -= (0.016 * steps * 1000);
             c.currentLapDuration += simulatedTimePassed;
             if (c.pitStopDuration <= 0) {
               c.isPitting = false;
               c.tireHealth = 100;
               addEvent(c.lap, `${c.driverName} exits pits.`, 'pitstop');
             }
             return c;
           }
           let speed = 0.05; 
           speed += (c.rating - 70) * 0.0005;
           if (c.isPlayer) {
             speed += (teamStats.power - 1) * 0.0008; 
             speed *= (1 + ((teamStats.aero - 1) * 0.005));
             if (setupConfidence && setupConfidence[c.driverId]) {
                const conf = setupConfidence[c.driverId];
                const setupMult = 0.98 + (conf * 0.0007);
                speed *= setupMult;
             }
           } else {
             speed += 0.0024; 
             speed *= 1.015;
           }
           const tireStats = TIRE_STATS[c.tireCompound];
           speed *= tireStats.speed;
           const healthFactor = c.tireHealth > 30 ? 1 : 0.6;
           speed *= (0.8 + (c.tireHealth / 500)) * healthFactor; 
           if (c.paceMode === 'PUSH') speed *= 1.04;
           if (c.paceMode === 'CONSERVE') speed *= 0.96;
           speed *= env.grip;
           speed *= (1 - c.performancePenalty);
           c.projectedLapTime = scenario.baseLapTime * (0.05 / speed);
           c.progress += speed * steps;
           let wear = 0.0010 * steps * scenario.degradationRate * tireStats.wear;
           if (c.paceMode === 'PUSH') wear *= 1.55; 
           if (c.paceMode === 'CONSERVE') wear *= 0.70;
           const tempImpact = 1 + ((env.temp - 30) * 0.015);
           wear *= Math.max(0.8, tempImpact);
           const gripImpact = 1 + ((1.05 - env.grip) * 0.4); 
           wear *= Math.max(0.8, gripImpact);
           if (c.isPlayer) {
              const mechanicalGrip = teamStats.chassis; 
              const aeroGrip = teamStats.aero;
              const preservationFactor = (mechanicalGrip * 0.02) + (aeroGrip * 0.005);
              wear *= (1 - preservationFactor);
           } else {
              const impliedLevel = (c.rating - 70) / 3;
              const oppPreservation = impliedLevel * 0.02;
              wear *= (1 - oppPreservation);
           }
           const fuelLoadFactor = 1 + ((track.laps - c.lap) / track.laps) * 0.15; 
           wear *= fuelLoadFactor;
           c.tireHealth = Math.max(0, c.tireHealth - wear);
           if (c.progress >= 100) {
             c.progress -= 100;
             c.lastLapTime = c.currentLapDuration;
             c.lapHistory.push(c.currentLapDuration);
             c.currentLapDuration = 0; 
             c.lap += 1;

             if (c.isPlayer && c.scheduledStops) {
                const scheduledStop = c.scheduledStops.find(ps => ps.lap === c.lap);
                if (scheduledStop && !c.isPitting) {
                   c.isPitting = true;
                   c.pitStopDuration = 22000 - (facilities.pitCrew * 500);
                   c.tireCompound = scheduledStop.compound;
                   addEvent(c.lap, `${c.driverName} boxing for ${c.tireCompound}s (Scheduled).`, 'pitstop');
                }
             }
           }
           if (!c.isPlayer && !c.isPitting && c.lap <= track.laps) {
              let aiPace: PaceMode = 'BALANCED';
              if (c.tireHealth > 82) aiPace = 'PUSH';
              else if (c.tireHealth < 28) aiPace = 'CONSERVE';
              if (idx > 0 && c.tireHealth > 35) {
                 const carAhead = prevCars[idx - 1];
                 const gapToAhead = c.gapToLeader - carAhead.gapToLeader;
                 if (gapToAhead > 0 && gapToAhead < 2.0) aiPace = 'PUSH';
              }
              c.paceMode = aiPace;
              const pitThreshold = 8 + (c.rating % 8);
              if (c.tireHealth < pitThreshold) {
                 c.isPitting = true;
                 c.pitStopDuration = 21500 + (Math.random() * 3000); 
                 const lapsRemaining = track.laps - c.lap;
                 if (lapsRemaining <= 15) c.tireCompound = 'SOFT';
                 else if (lapsRemaining <= 28) c.tireCompound = 'MEDIUM';
                 else c.tireCompound = 'HARD';
                 addEvent(c.lap, `${c.driverName} boxing for ${c.tireCompound}s.`, 'pitstop');
              }
           }
           return c;
        });
        nextCars.sort((a, b) => (a.lap !== b.lap) ? b.lap - a.lap : b.progress - a.progress);
        const leader = nextCars[0];
        nextCars.forEach((c, idx) => {
           c.position = idx + 1;
           const lapDiff = leader.lap - c.lap;
           const progDiff = leader.progress - c.progress;
           c.gapToLeader = (lapDiff * 100) + progDiff;
        });
        if (leader.lap > track.laps && !raceFinishedRef.current) {
           raceFinishedRef.current = true;
           finishRace(nextCars);
        } else {
           setCurrentLap(Math.min(leader.lap, track.laps));
        }
        return nextCars;
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    lastTimeRef.current = undefined; 
    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [racePhase, track, scenario, isPaused, gameSpeed]); 

  const addEvent = (lap: number, text: string, type: SimulationLog['type']) => {
    setEvents(prev => [{ lap, event: text, type }, ...prev].slice(0, 10));
  };

  const finishRace = (finalCars: LiveCarState[]) => {
    setRacePhase('FINISHED');
    const classification: RaceResult[] = finalCars.map(c => ({
      position: c.position,
      driverName: c.driverName,
      team: c.team,
      gap: c.position === 1 ? 'Winner' : c.lap < finalCars[0].lap ? `+${finalCars[0].lap - c.lap} Lap(s)` : `+${Math.floor(c.gapToLeader / 10)}s`,
      points: c.position <= 10 ? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][c.position - 1] : 0
    }));
    onRaceComplete({
      classification,
      commentary: events,
      summary: `Race finished at ${track?.name}. ${classification[0].driverName} takes the win!`
    });
  };

  const handlePlayerAction = (id: string, action: 'PIT' | 'MODE', value?: any) => {
    setCars(prev => prev.map(c => {
      if (c.driverId === id) {
        if (action === 'PIT' && !c.isPitting) {
           const pitTime = 22000 - (facilities.pitCrew * 500); 
           return { ...c, isPitting: true, pitStopDuration: pitTime, tireCompound: value };
        }
        if (action === 'MODE') return { ...c, paceMode: value };
      }
      return c;
    }));
  };

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const milli = Math.floor((ms % 1000) / 10);
    return `${min}:${sec.toString().padStart(2, '0')}.${milli.toString().padStart(2, '0')}`;
  };

  const handleCarClick = (driverId: string) => {
    if (isPaused) {
      setSelectedDriverForStats(selectedDriverForStats === driverId ? null : driverId);
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const renderTrackMap = () => {
    const rx = 180; const ry = 100; const cx = 200; const cy = 120;
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#222" strokeWidth="22" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#0a0a0a" strokeWidth="20" />
        <path d={`M${cx} ${cy-ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy+ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy-ry}`} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
        <line x1={cx} y1={cy + ry - 14} x2={cx} y2={cy + ry + 14} stroke="#ffffff" strokeWidth="4" />
        {/* Sector Lines */}
        <line x1={cx - rx} y1={cy} x2={cx - rx + 20} y2={cy} stroke="rgba(6,182,212,0.5)" strokeWidth="2" strokeDasharray="2,2" />
        <line x1={cx + rx - 20} y1={cy} x2={cx + rx} y2={cy} stroke="rgba(6,182,212,0.5)" strokeWidth="2" strokeDasharray="2,2" />
        <text x={cx - rx + 25} y={cy + 3} fill="rgba(6,182,212,0.5)" fontSize="8" fontFamily="monospace">S2</text>
        <text x={cx + rx - 25} y={cy + 3} fill="rgba(6,182,212,0.5)" fontSize="8" fontFamily="monospace" textAnchor="end">S3</text>
        <text x={cx} y={cy + ry - 20} fill="rgba(6,182,212,0.5)" fontSize="8" fontFamily="monospace" textAnchor="middle">S1</text>

        {cars.map(car => {
          const angle = (car.progress / 100) * 2 * Math.PI + (Math.PI / 2);
          const x = cx + rx * Math.cos(angle);
          const y = cy + ry * Math.sin(angle);
          
          // Fading trail calculation
          const trailAngle1 = ((car.progress - 1) / 100) * 2 * Math.PI + (Math.PI / 2);
          const tx1 = cx + rx * Math.cos(trailAngle1);
          const ty1 = cy + ry * Math.sin(trailAngle1);
          
          const trailAngle2 = ((car.progress - 2) / 100) * 2 * Math.PI + (Math.PI / 2);
          const tx2 = cx + rx * Math.cos(trailAngle2);
          const ty2 = cy + ry * Math.sin(trailAngle2);

          return (
            <g key={car.driverId}>
              <circle cx={tx2} cy={ty2} r={car.isPlayer ? 3 : 2} fill={car.color} opacity="0.2" />
              <circle cx={tx1} cy={ty1} r={car.isPlayer ? 4 : 3} fill={car.color} opacity="0.5" />
              {car.isPlayer && (
                 <circle cx={x} cy={y} r="10" fill={car.color} opacity="0.4" filter="url(#glow)">
                    <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
                 </circle>
              )}
              <circle cx={x} cy={y} r={car.isPlayer ? 6 : 4} fill={car.color} stroke={car.isPlayer ? "white" : "black"} strokeWidth={car.isPlayer ? 1.5 : 0.5} />
              <text x={x} y={y - 8} fill={car.isPlayer ? "white" : "#888"} fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                {getInitials(car.driverName)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (racePhase === 'LOADING' || !track || !scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-racing-neon"></div>
        <p className="text-slate-500 animate-pulse font-mono uppercase text-sm tracking-widest text-center">Configuring Physics Engine...</p>
      </div>
    );
  }

  if (racePhase === 'STRATEGY') {
    return (
      <div className="h-full flex flex-col max-w-6xl mx-auto space-y-6 animate-fade-in p-4 overflow-y-auto scrollbar-hide">
        <div className="text-center mb-4">
          <h2 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase">{track.name}</h2>
          <div className="flex items-center justify-center gap-4 mt-2">
             <span className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em] bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Degradation: <span className="text-white">{scenario.degradationRate}x</span></span>
             <span className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em] bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Weather: <span className={scenario.weatherCondition === 'Wet' ? 'text-blue-400' : 'text-yellow-400'}>{scenario.weatherCondition}</span></span>
          </div>
        </div>

        {gridOrder && (
           <div className="bg-black/40 p-4 rounded-xl border border-slate-800 flex items-center overflow-x-auto scrollbar-hide gap-4">
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest shrink-0 border-r border-slate-800 pr-4">Starting Grid</div>
              <div className="flex gap-4">
                 {gridOrder.map((g, i) => {
                    const d = drivers.find(d => d.id === g.id);
                    if (!d) return null;
                    return (
                      <div key={d.id} className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-500 w-4">{i + 1}</span>
                        <div className="w-6 h-6 rounded border border-slate-700 bg-black flex items-center justify-center text-[8px] font-bold text-racing-neon">
                           {getInitials(d.name)}
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold uppercase truncate max-w-[60px]">{d.name.split(' ').pop()}</span>
                      </div>
                    )
                 })}
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {drivers.map(driver => (
            <div key={driver.id} className="glass-panel p-6 rounded-2xl border-t-4 border-racing-red shadow-2xl flex flex-col gap-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-racing-red/5 rounded-bl-full -z-10"></div>
               
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-2xl font-display font-black text-white shadow-inner">
                     {getInitials(driver.name)}
                  </div>
                  <div>
                     <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter leading-none">{driver.name}</h3>
                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Car #{driver.id.split('-')[0]}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-2 tracking-widest">Starting Compound</p>
                    <div className="flex gap-2">
                       {(['SOFT', 'MEDIUM', 'HARD'] as TireCompound[]).map(type => (
                         <button
                           key={type}
                           onClick={() => setPlayerStrategies(p => ({ ...p, [driver.id]: { ...p[driver.id], startingCompound: type } }))}
                           className={`
                             flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                             ${playerStrategies[driver.id]?.startingCompound === type ? 'bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-slate-800 hover:border-slate-600 bg-black/40'}
                           `}
                         >
                           <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: TIRE_STATS[type].color, borderColor: 'rgba(255,255,255,0.2)' }}></div>
                           <span className="font-bold text-[10px] font-mono tracking-wider">{TIRE_STATS[type].label}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="bg-black/40 rounded-xl border border-slate-800 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Pit Strategy Timeline</p>
                      <button 
                        onClick={() => setPlayerStrategies(p => {
                          const current = p[driver.id];
                          return { 
                            ...p, 
                            [driver.id]: { 
                              ...current, 
                              pitStops: [...current.pitStops, { lap: Math.floor(track.laps / 2), compound: 'MEDIUM' }] 
                            } 
                          };
                        })}
                        className="text-[9px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-widest border border-slate-700"
                      >
                        + Add Stop
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {playerStrategies[driver.id]?.pitStops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-3 bg-black p-2 rounded-lg border border-slate-800">
                          <div className="flex flex-col items-center px-2 border-r border-slate-800">
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Lap</span>
                            <input 
                              type="number" 
                              min="1" 
                              max={track.laps} 
                              value={stop.lap}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setPlayerStrategies(p => {
                                  const newStops = [...p[driver.id].pitStops];
                                  newStops[index].lap = val;
                                  return { ...p, [driver.id]: { ...p[driver.id], pitStops: newStops } };
                                });
                              }}
                              className="w-12 bg-transparent text-white text-sm text-center font-mono font-bold focus:outline-none"
                            />
                          </div>
                          <div className="flex-1 flex gap-1">
                            {(['SOFT', 'MEDIUM', 'HARD'] as TireCompound[]).map(type => (
                              <button
                                key={type}
                                onClick={() => {
                                  setPlayerStrategies(p => {
                                    const newStops = [...p[driver.id].pitStops];
                                    newStops[index].compound = type;
                                    return { ...p, [driver.id]: { ...p[driver.id], pitStops: newStops } };
                                  });
                                }}
                                className={`
                                  flex-1 py-1.5 rounded-md border text-[9px] font-bold transition-colors
                                  ${stop.compound === type ? 'bg-white/10 text-white' : 'border-transparent text-slate-500 hover:bg-white/5'}
                                `}
                                style={{ borderColor: stop.compound === type ? TIRE_STATS[type].color : 'transparent' }}
                              >
                                {TIRE_STATS[type].label}
                              </button>
                            ))}
                          </div>
                          <button 
                            onClick={() => {
                              setPlayerStrategies(p => {
                                const newStops = p[driver.id].pitStops.filter((_, i) => i !== index);
                                return { ...p, [driver.id]: { ...p[driver.id], pitStops: newStops } };
                              });
                            }}
                            className="text-slate-600 hover:text-red-500 p-2 font-bold text-xl leading-none transition-colors"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {playerStrategies[driver.id]?.pitStops.length === 0 && (
                        <div className="text-[10px] text-slate-600 font-mono text-center py-4 border border-dashed border-slate-800 rounded-lg bg-black/20">
                          NO STOPS SCHEDULED
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
        <button 
          onClick={() => startRace(scenario, playerStrategies, track)}
          className="w-full py-5 bg-white text-black font-display font-black text-xl uppercase tracking-widest rounded-2xl hover:bg-racing-neon transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] mt-4"
        >
          Begin Session
        </button>
      </div>
    );
  }

  const renderStrategyModal = () => {
    const car = cars.find(c => c.driverId === selectedDriverForStrategy);
    if (!car || !scenario || !track) return null;

    const teamStats = calculateCarStats();
    const env = raceEnvRef.current;
    
    const getWearPerLap = (compound: TireCompound, pace: PaceMode) => {
      const tireStats = TIRE_STATS[compound];
      let wear = (scenario.baseLapTime / 16) * 0.0010 * scenario.degradationRate * tireStats.wear;
      if (pace === 'PUSH') wear *= 1.55; 
      if (pace === 'CONSERVE') wear *= 0.70;
      
      const tempImpact = 1 + ((env.temp - 30) * 0.015);
      wear *= Math.max(0.8, tempImpact);
      const gripImpact = 1 + ((1.05 - env.grip) * 0.4); 
      wear *= Math.max(0.8, gripImpact);
      
      const mechanicalGrip = teamStats.chassis; 
      const aeroGrip = teamStats.aero;
      const preservationFactor = (mechanicalGrip * 0.02) + (aeroGrip * 0.005);
      wear *= (1 - preservationFactor);
      
      const avgFuelLoadFactor = 1 + ((track.laps - car.lap) / track.laps / 2) * 0.15; 
      wear *= avgFuelLoadFactor;
      
      return wear;
    };

    const currentWearPerLap = getWearPerLap(car.tireCompound, car.paceMode);
    const estimatedLapsRemaining = Math.max(0, Math.floor(car.tireHealth / currentWearPerLap));

    return (
      <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-black border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">
              Race Strategy: {car.driverName}
            </h2>
            <button onClick={() => setSelectedDriverForStrategy(null)} className="text-slate-500 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          
          <div className="p-6 overflow-y-auto flex flex-col gap-6 max-h-[70vh]">
            <div className="grid grid-cols-2 gap-4">
               <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Current Tire</p>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-black text-lg" style={{ backgroundColor: TIRE_STATS[car.tireCompound].color }}>
                       {car.tireCompound[0]}
                     </div>
                     <div>
                       <div className="text-2xl font-mono font-bold text-white">{Math.round(car.tireHealth)}%</div>
                       <div className="text-[10px] text-slate-400 uppercase">{car.tireCompound}</div>
                     </div>
                  </div>
               </div>
               
               <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Predicted Life</p>
                  <div className="text-3xl font-mono font-bold text-racing-neon mb-1">~{estimatedLapsRemaining} <span className="text-sm text-slate-400">Laps</span></div>
                  <p className="text-[10px] text-slate-500 uppercase">Based on {car.paceMode} pace</p>
               </div>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Race Pace</p>
              <div className="flex bg-black p-1 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                 {(['CONSERVE', 'BALANCED', 'PUSH'] as PaceMode[]).map((m) => (
                    <button 
                      key={m} 
                      onClick={() => handlePlayerAction(car.driverId, 'MODE', m)} 
                      className={`flex-1 py-3 text-xs font-black uppercase transition-all flex items-center justify-center gap-2 rounded-lg ${car.paceMode === m ? `${PACE_CONFIG[m].color} text-black shadow-lg scale-100` : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <span>{PACE_CONFIG[m].icon}</span>
                      <span>{m}</span>
                    </button>
                 ))}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Scheduled Pit Stops</p>
                <button 
                  onClick={() => {
                    setCars(prev => prev.map(c => {
                      if (c.driverId === car.driverId) {
                        const newStops = [...(c.scheduledStops || []), { lap: Math.min(track.laps, c.lap + 5), compound: 'MEDIUM' as TireCompound }];
                        return { ...c, scheduledStops: newStops };
                      }
                      return c;
                    }));
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors uppercase font-bold"
                >
                  + Add Stop
                </button>
              </div>
              
              <div className="space-y-2">
                {car.scheduledStops?.map((stop, index) => {
                  const isPast = stop.lap < car.lap;
                  return (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${isPast ? 'bg-slate-900/50 border-slate-800/50 opacity-50' : 'bg-black/50 border-slate-700'}`}>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Lap</span>
                      <input 
                        type="number" 
                        min={car.lap} 
                        max={track.laps} 
                        value={stop.lap}
                        disabled={isPast}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || car.lap;
                          setCars(prev => prev.map(c => {
                            if (c.driverId === car.driverId && c.scheduledStops) {
                              const newStops = [...c.scheduledStops];
                              newStops[index].lap = val;
                              return { ...c, scheduledStops: newStops };
                            }
                            return c;
                          }));
                        }}
                        className="w-16 bg-slate-900 border border-slate-600 rounded text-white text-sm p-1.5 text-center font-mono"
                      />
                    </div>
                    <div className="flex-1 flex gap-1">
                      {(['SOFT', 'MEDIUM', 'HARD'] as TireCompound[]).map(type => (
                        <button
                          key={type}
                          disabled={isPast}
                          onClick={() => {
                            setCars(prev => prev.map(c => {
                              if (c.driverId === car.driverId && c.scheduledStops) {
                                const newStops = [...c.scheduledStops];
                                newStops[index].compound = type;
                                return { ...c, scheduledStops: newStops };
                              }
                              return c;
                            }));
                          }}
                          className={`
                            flex-1 py-2 rounded border text-[10px] font-bold transition-colors
                            ${stop.compound === type ? 'bg-white/10 border-white text-white' : 'border-slate-800 text-slate-500 hover:border-slate-600'}
                          `}
                        >
                          {TIRE_STATS[type].label} - {type}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={isPast}
                      onClick={() => {
                        setCars(prev => prev.map(c => {
                          if (c.driverId === car.driverId && c.scheduledStops) {
                            const newStops = c.scheduledStops.filter((_, i) => i !== index);
                            return { ...c, scheduledStops: newStops };
                          }
                          return c;
                        }));
                      }}
                      className="text-red-500 hover:text-red-400 p-2 font-bold text-xl leading-none disabled:opacity-50"
                    >
                      &times;
                    </button>
                  </div>
                )})}
                {(!car.scheduledStops || car.scheduledStops.length === 0) && (
                  <div className="text-xs text-slate-500 italic text-center py-4 border border-dashed border-slate-800 rounded-lg">
                    No stops scheduled
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  };

  const myCars = cars.filter(c => c.isPlayer);
  
  return (
    <div className="h-[calc(100vh-11rem)] flex flex-col gap-4 overflow-hidden">
      {isPaused && selectedDriverForStrategy && renderStrategyModal()}
      {/* HEADER TELEMETRY */}
      <div className="flex justify-between items-center bg-black/60 p-3 sm:p-4 rounded-xl border-b border-slate-800 shadow-2xl shrink-0">
        <div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <h2 className="text-sm sm:text-lg font-display font-black text-white italic tracking-tighter uppercase truncate">{track.name}</h2>
           </div>
           <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">
             <span className={`${raceEnvRef.current.weather === 'Wet' ? 'text-blue-400' : 'text-racing-neon'}`}>
                {raceEnvRef.current.weather}
             </span>
             <span>🌡️ {trackTemp.toFixed(0)}°C</span>
             <span className="hidden sm:inline">Grip: {(trackGrip * 100).toFixed(0)}%</span>
           </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
           <div className="text-center">
              <span className="text-[8px] text-slate-600 block uppercase font-bold">Lap</span>
              <span className="text-xl sm:text-3xl font-mono font-bold text-white leading-none">{currentLap} <span className="text-sm text-slate-700">/ {track.laps}</span></span>
           </div>
           <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 sm:px-4 rounded text-[10px] font-bold uppercase border transition-all ${isPaused ? 'bg-racing-neon border-racing-neon text-black' : 'bg-transparent border-slate-700 text-slate-300'}`}
              >
                {isPaused ? '▶' : '||'}
              </button>
              <button onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : gameSpeed === 2 ? 4 : 1)} className="px-2 py-2 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400">
                {gameSpeed}x
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex flex-col lg:flex-row gap-4">
        
        {/* LEADERBOARD & MAP CONTAINER */}
        <div className="relative flex-1 min-h-[40vh] bg-black rounded-xl overflow-hidden border border-slate-900 shadow-2xl flex flex-col">
          
          {/* TRACK MAP (Full Center) */}
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12 z-10">
             {renderTrackMap()}
          </div>

          {/* FLOATING LEADERBOARD (High visibility overlay) */}
          <div className="absolute top-0 left-0 h-full w-72 sm:w-80 lg:w-96 bg-black/80 lg:bg-black/40 backdrop-blur-xl lg:backdrop-blur-md z-30 border-r border-white/10 flex flex-col shadow-2xl">
             <div className="p-3 bg-black/90 font-black text-[10px] uppercase tracking-widest text-slate-500 grid grid-cols-[20px_1fr_40px_50px_45px] gap-2 border-b border-slate-800 px-4">
                <span>#</span>
                <span>Driver</span>
                <span className="text-right">Gap</span>
                <span className="text-right">Last</span>
                <span className="text-right">Tire</span>
             </div>
                          <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
                {cars.map((car) => {
                  const formattedTime = car.lastLapTime ? formatTime(car.lastLapTime) : '--.---';
                  const displayTime = formattedTime.startsWith('0:') ? formattedTime.substring(2) : formattedTime;
                  
                  return (
                  <div 
                    key={car.driverId} 
                    onClick={() => handleCarClick(car.driverId)}
                    className={`
                      grid grid-cols-[20px_1fr_40px_50px_45px] gap-2 items-center px-4 py-2.5 border-l-2 transition-all cursor-pointer even:bg-white/5
                      ${car.isPlayer ? 'bg-racing-gold/10 border-racing-gold' : 'hover:bg-white/10 border-transparent'}
                      ${selectedDriverForStats === car.driverId ? 'bg-white/20 ring-1 ring-white/10' : ''}
                    `}
                  >
                     <span className="font-mono text-[10px] font-bold text-slate-500">{car.position}</span>

                     <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className="w-1.5 h-3 rounded-full shrink-0" style={{ backgroundColor: car.color }}></div>
                        <span className={`text-[12px] font-black uppercase italic leading-none truncate ${car.isPlayer ? 'text-white' : 'text-slate-300'}`}>
                           {car.driverName}
                        </span>
                        {car.isPitting && <span className="text-[7px] bg-racing-gold text-black px-1 rounded-sm font-black shrink-0">PIT</span>}
                     </div>

                     <div className="text-right">
                        <span className={`text-[11px] font-mono ${car.isPlayer ? 'text-racing-gold font-bold' : 'text-slate-400'}`}>
                          {car.position === 1 ? 'LDR' : `+${(car.gapToLeader / 10).toFixed(1)}`}
                        </span>
                     </div>

                     <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400">
                          {displayTime}
                        </span>
                     </div>

                     <div className="flex justify-end items-center gap-1">
                        <span className={`text-[9px] font-mono font-bold ${car.tireHealth < 30 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                           {Math.round(car.tireHealth)}%
                        </span>
                        <span 
                          className="text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-sm text-black shadow-lg shrink-0" 
                          style={{ backgroundColor: TIRE_STATS[car.tireCompound].color }}
                        >
                          {car.tireCompound[0]}
                        </span>
                     </div>
                  </div>
                )})}
              </div>
          </div>

          {/* TELEMETRY POPUP */}
          {isPaused && selectedDriverForStats && (
            <div className="absolute top-4 right-4 z-40 bg-black/95 border border-slate-700 rounded-lg shadow-2xl p-5 w-64 animate-fade-in backdrop-blur-2xl">
               <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                 <h3 className="font-black text-sm text-white uppercase italic tracking-tighter">{cars.find(c => c.driverId === selectedDriverForStats)?.driverName}</h3>
                 <button onClick={() => setSelectedDriverForStats(null)} className="text-slate-500 hover:text-white text-xl">&times;</button>
               </div>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Recent Laps</p>
                     {cars.find(c => c.driverId === selectedDriverForStats)?.lapHistory.slice(-5).reverse().map((time, i) => (
                       <div key={i} className="flex justify-between text-[11px] font-mono border-b border-white/5 pb-1">
                          <span className="text-slate-600">L{currentLap - 1 - i}</span>
                          <span className="text-racing-neon font-bold">{formatTime(time).split(':').slice(1).join(':')}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* FEED & STRATEGY PANEL */}
        <div className="flex flex-col gap-4 lg:w-96 shrink-0 h-full max-h-[350px] lg:max-h-none">
           
           {/* EVENTS LOG */}
           <div className="flex-1 glass-panel rounded-xl p-4 overflow-y-auto flex flex-col-reverse scrollbar-hide border border-slate-800 shadow-inner bg-black/80 scanlines relative">
              <div className="absolute top-2 right-4 text-[8px] font-mono text-slate-600 uppercase tracking-widest">Live Feed</div>
              {events.map((e, i) => (
                 <div key={i} className={`text-[11px] py-1.5 flex gap-4 font-mono ${e.type === 'issue' ? 'text-red-400 font-bold' : 'text-slate-400'} ${i === 0 ? 'blinking-cursor text-white' : 'opacity-80'}`}>
                    <span className="text-racing-neon font-black shrink-0">[{e.lap}]</span>
                    <span className="tracking-tight">{e.event}</span>
                 </div>
              ))}
           </div>

           {/* STRATEGY CONTROLS */}
           <div className="flex flex-col gap-3 shrink-0">
              {myCars.map((car) => (
                 <div key={car.driverId} className={`glass-panel p-4 rounded-xl border-l-4 flex flex-col gap-4 shadow-2xl transition-all ${car.isPitting ? 'bg-slate-900/60 border-racing-gold' : 'bg-black/80 border-racing-neon'}`}>
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg border border-slate-700 bg-black flex items-center justify-center text-[12px] font-black text-white shrink-0 shadow-inner">
                             {getInitials(car.driverName)}
                          </div>
                          <div className="min-w-0">
                             <h3 className="font-display font-black text-lg text-white uppercase italic tracking-tighter truncate leading-none mb-1">{car.driverName.split(' ').pop()}</h3>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400">P{car.position}</span>
                                <span className="text-[10px] font-mono text-slate-600">|</span>
                                <span className="text-[10px] font-mono text-slate-400">{car.position === 1 ? 'LDR' : `+${(car.gapToLeader / 10).toFixed(1)}s`}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-end">
                          <span className="text-[8px] uppercase font-bold text-slate-500 tracking-widest mb-1">Tire Status</span>
                          <div className="flex items-center gap-2">
                             <div className="text-right">
                                <div className={`text-lg font-mono font-black leading-none ${car.tireHealth < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                   {Math.round(car.tireHealth)}%
                                </div>
                             </div>
                             <div 
                               className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-black shadow-lg"
                               style={{ backgroundColor: TIRE_STATS[car.tireCompound].color, borderColor: 'rgba(255,255,255,0.2)' }}
                             >
                               {car.tireCompound[0]}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                       <div className="flex bg-black p-1 rounded-lg border border-slate-800 shadow-inner">
                          {(['CONSERVE', 'BALANCED', 'PUSH'] as PaceMode[]).map((m) => (
                             <button 
                               key={m} 
                               onClick={() => handlePlayerAction(car.driverId, 'MODE', m)} 
                               className={`flex-1 py-2 text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 rounded-md ${car.paceMode === m ? `${PACE_CONFIG[m].color} text-black shadow-[0_0_10px_rgba(255,255,255,0.1)] scale-100` : 'text-slate-600 hover:text-slate-400'}`}
                             >
                               <span>{PACE_CONFIG[m].icon}</span>
                               <span className="hidden sm:inline">{m}</span>
                             </button>
                          ))}
                       </div>
                       
                       <div className="flex gap-1 shrink-0 bg-black p-1 rounded-lg border border-slate-800">
                          {(['SOFT', 'MEDIUM', 'HARD'] as TireCompound[]).map(tc => (
                            <button 
                              key={tc} 
                              onClick={() => handlePlayerAction(car.driverId, 'PIT', tc)} 
                              className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-black transition-all ${car.isPitting ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white hover:text-black hover:scale-105 active:scale-95'}`}
                              style={{ color: TIRE_STATS[tc].color, border: `1px solid ${TIRE_STATS[tc].color}40` }}
                              title={`Box for ${tc}`}
                            >
                              {tc[0]}
                            </button>
                          ))}
                       </div>
                    </div>

                    {car.scheduledStops && car.scheduledStops.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/50 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest shrink-0">Stops:</span>
                        <div className="flex gap-1.5">
                          {car.scheduledStops.map((stop, i) => {
                            const isPast = stop.lap < car.lap;
                            return (
                              <div key={i} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${isPast ? 'border-slate-800/50 text-slate-600 bg-slate-900/30' : 'border-slate-700 text-slate-300 bg-black/40'}`}>
                                <span className={isPast ? 'line-through' : ''}>L{stop.lap}</span>
                                <span>&rarr;</span>
                                <span className="font-black" style={{ color: isPast ? '#475569' : TIRE_STATS[stop.compound].color }}>{stop.compound[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {car.isPitting && (
                      <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5 mt-1">
                        <div className="h-full bg-racing-gold animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                    )}

                    {isPaused && (
                      <button 
                        onClick={() => setSelectedDriverForStrategy(car.driverId)}
                        className="mt-1 w-full py-2 text-[9px] font-bold uppercase tracking-widest border border-slate-700 text-slate-400 rounded-lg hover:border-racing-neon hover:text-racing-neon transition-colors"
                      >
                        Open Strategy Editor
                      </button>
                    )}
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default RaceControl;