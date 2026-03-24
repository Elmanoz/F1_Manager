import React, { useState, useEffect } from 'react';
import { TeamFacilities, CarPart, Driver, PartCategory } from '../types';

interface TeamHQProps {
  carParts: Record<string, CarPart>;
  facilities: TeamFacilities;
  drivers: Driver[];
  budget: number;
  onUpgradePart: (partId: string, cost: number) => void;
  onUpgradeFacility: (type: keyof TeamFacilities, cost: number) => void;
  onTrainDriver: (driverId: string) => void;
  onNext: () => void;
  gameState: any; // Pass the state to allow manual saving
}

const TeamHQ: React.FC<TeamHQProps> = ({ 
  carParts, 
  facilities, 
  drivers, 
  budget, 
  onUpgradePart, 
  onUpgradeFacility, 
  onTrainDriver, 
  onNext,
  gameState
}) => {
  const [activeTab, setActiveTab] = useState<'R&D' | 'FACILITIES' | 'DRIVERS'>('R&D');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');
  const [selectedPartId, setSelectedPartId] = useState<string>(Object.keys(carParts)[0]);

  const handleManualSave = () => {
    setSaveStatus('SAVING');
    const savePacket = {
      phase: 'HQ',
      gameState: gameState
    };
    localStorage.setItem('f1ManagerSave', JSON.stringify(savePacket));
    setTimeout(() => {
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }, 600);
  };

  const calculatePartCost = (part: CarPart) => {
    const rawCost = part.baseCost * Math.pow(1.5, part.level - 1);
    const factoryDiscount = 1 - ((facilities.factory - 1) * 0.05);
    return Math.max(1, Math.floor(rawCost * factoryDiscount));
  };

  const calculateFacilityCost = (currentLevel: number) => Math.floor(5 * Math.pow(1.8, currentLevel - 1));

  const renderPartCard = (part: CarPart) => {
    const cost = calculatePartCost(part);
    const isMaxed = part.level >= part.maxLevel;
    const canAfford = budget >= cost && !isMaxed;

    return (
      <div key={part.id} className="glass-panel group flex flex-col h-full rounded-xl border border-slate-800 hover:border-racing-red transition-all duration-300 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-black/40">
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{part.category}</span>
           <span className="text-xl font-black italic text-f1-red whitespace-nowrap">
             Lv.{part.level}<span className="text-xs text-slate-600 font-normal not-italic ml-1">/ {part.maxLevel}</span>
           </span>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold uppercase mb-2 leading-tight truncate text-white" title={part.name}>{part.name}</h3>
          <p className="text-sm text-slate-400 mb-4 h-10 overflow-hidden text-ellipsis leading-tight line-clamp-2">
            {part.description}
          </p>
          
          <div className="text-xs font-mono bg-black/60 p-2 rounded text-slate-300 mb-4 whitespace-nowrap overflow-hidden text-ellipsis border border-slate-800/50">
             Effect: <span className="font-bold text-racing-neon">{part.statEffect}</span>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800">
             <div className="font-bold text-lg text-white whitespace-nowrap mr-2">
               ${cost}M
             </div>
             <button
               onClick={() => onUpgradePart(part.id, cost)}
               disabled={!canAfford || isMaxed}
               className={`
                 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide btn-f1 whitespace-nowrap
                 ${isMaxed 
                   ? 'bg-slate-800 text-slate-600 cursor-default' 
                   : canAfford 
                     ? 'bg-f1-red text-white' 
                     : 'bg-slate-900 text-slate-700 cursor-not-allowed'}
               `}
             >
               {isMaxed ? 'Max' : 'Upgrade'}
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFacilityCard = (name: string, type: keyof TeamFacilities, desc: string, icon: string) => {
    const level = facilities[type];
    const cost = calculateFacilityCost(level);
    const isMaxed = level >= 10;
    const canAfford = budget >= cost && !isMaxed;

    return (
      <div key={type} className="glass-panel flex flex-col p-6 border border-slate-800 rounded-xl hover:border-slate-600 transition-all relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent group-hover:via-f1-red transition-all duration-500"></div>
         
         <div className="flex items-start justify-between mb-4">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
               {icon}
             </div>
             <div>
               <h3 className="text-xl font-bold uppercase tracking-tight text-white">{name}</h3>
               <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">Facility Level {level}</div>
             </div>
           </div>
         </div>
         
         <p className="text-sm text-slate-400 mb-6 h-10 line-clamp-2">{desc}</p>
         
         <div className="mb-6">
           <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
             <span>Progress</span>
             <span className="text-white">{level} / 10</span>
           </div>
           <div className="flex gap-1 h-2">
             {Array.from({ length: 10 }).map((_, i) => (
               <div 
                 key={i} 
                 className={`flex-1 rounded-sm ${i < level ? 'bg-f1-red shadow-[0_0_8px_rgba(225,6,0,0.4)]' : 'bg-slate-900 border border-slate-800'}`}
               />
             ))}
           </div>
         </div>
         
         <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between">
           <div className="flex flex-col">
             <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">Upgrade Cost</span>
             {isMaxed ? (
               <span className="text-lg font-mono font-bold text-slate-600">MAXED</span>
             ) : (
               <span className={`text-xl font-mono font-bold ${canAfford ? 'text-white' : 'text-slate-500'}`}>
                 ${cost}M
               </span>
             )}
           </div>
           
           <button
              onClick={() => onUpgradeFacility(type, cost)}
              disabled={!canAfford || isMaxed}
              className={`
                px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition-all border
                ${isMaxed 
                  ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed' 
                  : canAfford 
                    ? 'bg-white border-white text-black hover:bg-transparent hover:text-white' 
                    : 'bg-transparent border-slate-800 text-slate-600 cursor-not-allowed'}
              `}
           >
             {isMaxed ? 'Max Level' : 'Upgrade'}
           </button>
         </div>
      </div>
    );
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const renderDriverCard = (driver: Driver) => {
    const costToUpgrade = 500 * Math.pow(1.05, driver.rating - 70);
    const costRounded = Math.ceil(costToUpgrade / 10) * 10;
    const canAfford = driver.developmentPoints >= costRounded;

    return (
      <div key={driver.id} className="glass-panel grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 p-4 rounded-xl border border-slate-800 hover:border-racing-neon transition-colors duration-500">
         <div className="h-32 md:h-full bg-black rounded-lg border border-slate-800 flex items-center justify-center text-4xl font-display font-black text-racing-neon shadow-inner">
            {getInitials(driver.name)}
         </div>

         <div className="flex flex-col justify-between min-w-0">
            <div className="flex justify-between items-start gap-2 mb-4">
               <div className="min-w-0 flex-1">
                   <h3 className="text-2xl font-display font-black uppercase italic leading-none truncate text-white" title={driver.name}>
                     {driver.name}
                   </h3>
                   <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded whitespace-nowrap border border-slate-700">{driver.nationality}</span>
                      <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded border border-slate-800 uppercase font-black tracking-widest whitespace-nowrap">Contract: {driver.contractExpiryYear}</span>
                   </div>
               </div>
               <div className="text-right shrink-0 bg-black/40 p-2 rounded-lg border border-slate-800/50">
                  <span className="block text-[9px] text-slate-500 uppercase tracking-widest whitespace-nowrap mb-1">Skill Level</span>
                  <span className="text-2xl font-mono font-bold text-racing-neon leading-none">{driver.rating}<span className="text-sm text-slate-600">/99</span></span>
               </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
               <div className="bg-black/40 p-2 rounded border border-slate-800/50 text-center">
                  <div className="text-[8px] uppercase font-bold text-slate-500 tracking-widest mb-1">Wins</div>
                  <div className="text-sm font-mono font-bold text-white leading-none">{driver.stats.wins}</div>
               </div>
               <div className="bg-black/40 p-2 rounded border border-slate-800/50 text-center">
                  <div className="text-[8px] uppercase font-bold text-slate-500 tracking-widest mb-1">Podiums</div>
                  <div className="text-sm font-mono font-bold text-white leading-none">{driver.stats.podiums}</div>
               </div>
               <div className="bg-black/40 p-2 rounded border border-slate-800/50 text-center">
                  <div className="text-[8px] uppercase font-bold text-slate-500 tracking-widest mb-1">Poles</div>
                  <div className="text-sm font-mono font-bold text-white leading-none">{driver.stats.poles}</div>
               </div>
               <div className="bg-black/40 p-2 rounded border border-slate-800/50 text-center">
                  <div className="text-[8px] uppercase font-bold text-slate-500 tracking-widest mb-1">Titles</div>
                  <div className="text-sm font-mono font-bold text-racing-gold leading-none">{driver.stats.championships}</div>
               </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Training XP</span>
                  <span className="text-lg font-mono font-bold text-white leading-none">{driver.developmentPoints}</span>
                </div>
                <button
                   onClick={() => onTrainDriver(driver.id)}
                   disabled={!canAfford || driver.rating >= 99}
                   className={`
                      px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border whitespace-nowrap
                      ${canAfford
                         ? 'border-racing-neon text-racing-neon hover:bg-racing-neon hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                         : 'border-slate-800 text-slate-700 cursor-not-allowed'
                      }
                   `}
                >
                   Train (-{costRounded} XP)
                </button>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-8 animate-fade-in relative pb-24">
      {saveStatus === 'SUCCESS' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
           <div className="bg-racing-red text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 border-white">
              <span>✓</span> GAME SAVED
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end border-b-[2px] border-slate-800 pb-4 gap-4">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <div>
            <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">Team <span className="text-f1-red">HQ</span></h2>
            <p className="text-slate-500 mt-1 font-medium font-mono text-xs uppercase tracking-[0.2em]">Operational Hub 2026</p>
          </div>
          
          <button 
            onClick={handleManualSave}
            disabled={saveStatus !== 'IDLE'}
            className={`
              flex items-center gap-2 px-6 py-2 border rounded-lg font-bold uppercase text-sm transition-all mb-1
              ${saveStatus === 'IDLE' 
                ? 'border-slate-700 text-slate-400 hover:border-white hover:text-white' 
                : saveStatus === 'SAVING'
                  ? 'border-slate-800 text-slate-800 cursor-wait'
                  : 'border-green-600 text-green-600'
              }
            `}
          >
            {saveStatus === 'IDLE' && <span>💾 Save State</span>}
            {saveStatus === 'SAVING' && <span>Writing...</span>}
            {saveStatus === 'SUCCESS' && <span>✓ Success</span>}
          </button>
        </div>
        
        <div className="text-right whitespace-nowrap">
          <p className="text-xs text-slate-600 uppercase tracking-widest font-bold">Available Capital</p>
          <p className="text-4xl font-mono font-bold text-racing-neon tracking-tighter">${budget}M</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-lg shadow-2xl w-fit border border-slate-800">
        {['R&D', 'FACILITIES', 'DRIVERS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'R&D' && (
          <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
            <div className="w-full lg:w-1/3 flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-hide">
               {Object.values(carParts).map(part => (
                  <button 
                    key={part.id}
                    onClick={() => setSelectedPartId(part.id)} 
                    className={`p-4 text-left border rounded-xl transition-all ${selectedPartId === part.id ? 'border-racing-neon bg-racing-neon/10' : 'border-slate-800 hover:border-slate-600 bg-black/40'}`}
                  >
                     <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{part.category}</span>
                       <span className="text-xs font-mono text-slate-400">Lv.{part.level}/{part.maxLevel}</span>
                     </div>
                     <div className="font-display font-bold text-lg text-white uppercase tracking-tight">{part.name}</div>
                  </button>
               ))}
            </div>
            
            <div className="flex-1 glass-panel border border-slate-800 rounded-xl p-8 relative overflow-hidden blueprint-grid flex flex-col">
               {carParts[selectedPartId] && (() => {
                 const part = carParts[selectedPartId];
                 const cost = calculatePartCost(part);
                 const isMaxed = part.level >= part.maxLevel;
                 const canAfford = budget >= cost && !isMaxed;
                 
                 return (
                   <>
                     <div className="flex justify-between items-start mb-8">
                       <div>
                         <div className="text-[10px] uppercase font-bold text-racing-neon tracking-widest mb-1 border border-racing-neon/30 bg-racing-neon/10 px-2 py-0.5 rounded inline-block">
                           {part.category}
                         </div>
                         <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mt-2">{part.name}</h2>
                       </div>
                       <div className="text-right">
                         <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Current Level</div>
                         <div className="text-3xl font-mono font-bold text-white">{part.level}<span className="text-lg text-slate-600">/{part.maxLevel}</span></div>
                       </div>
                     </div>
                     
                     <div className="flex-1 flex flex-col justify-center max-w-md">
                       <p className="text-slate-400 text-sm leading-relaxed mb-8 border-l-2 border-slate-700 pl-4">{part.description}</p>
                       
                       <div className="bg-black/60 border border-slate-800 border-dashed rounded-lg p-6 mb-8">
                         <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Performance Impact</div>
                         <div className="text-xl font-mono text-racing-neon font-bold">{part.statEffect}</div>
                       </div>
                     </div>
                     
                     <div className="mt-auto pt-6 border-t border-slate-800 flex items-center justify-between">
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Development Cost</div>
                         {isMaxed ? (
                           <div className="text-2xl font-mono font-bold text-slate-600">MAXED OUT</div>
                         ) : (
                           <div className={`text-3xl font-mono font-bold ${canAfford ? 'text-white' : 'text-red-500'}`}>${cost}M</div>
                         )}
                       </div>
                       
                       <button
                         onClick={() => onUpgradePart(part.id, cost)}
                         disabled={!canAfford || isMaxed}
                         className={`
                           px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all
                           ${isMaxed 
                             ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                             : canAfford 
                               ? 'bg-white text-black hover:bg-racing-neon shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                               : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'}
                         `}
                       >
                         {isMaxed ? 'Maximum Level Reached' : 'Authorize Upgrade'}
                       </button>
                     </div>
                   </>
                 );
               })()}
            </div>
          </div>
        )}

        {activeTab === 'FACILITIES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {renderFacilityCard('Factory', 'factory', 'Optimizes R&D budget efficiency.', '🏭')}
            {renderFacilityCard('Simulator', 'simulator', 'Accelerates driver development.', '🎮')}
            {renderFacilityCard('Pit Crew', 'pitCrew', 'Enhances pit entry/exit speed.', '🔧')}
          </div>
        )}

        {activeTab === 'DRIVERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {drivers.map(renderDriverCard)}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-racing-black/90 backdrop-blur-md border-t border-slate-900 p-4 z-40 flex justify-end shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
         <div className="max-w-[1600px] w-full mx-auto flex justify-end px-4 md:px-8">
             <button
                onClick={onNext}
                className="bg-f1-red text-white px-8 md:px-12 py-3 md:py-4 rounded-r-2xl font-display font-black text-lg md:text-xl uppercase italic tracking-wider hover:bg-red-700 transition-colors shadow-2xl flex items-center gap-3 clip-path-slant whitespace-nowrap"
             >
                Initiate Race Weekend <span className="text-2xl">→</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export default TeamHQ;