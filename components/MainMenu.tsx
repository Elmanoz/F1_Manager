import React, { useState } from 'react';

interface MainMenuProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  hasSave: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onLoadGame, hasSave }) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-racing-dark text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-racing-dark/80 to-racing-dark"></div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-racing-red/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-racing-neon/10 rounded-full blur-[120px]"></div>

      {/* Content */}
      <div className="z-10 text-center space-y-12 animate-fade-in-up">
        
        {/* Logo */}
        <div className="space-y-2">
            <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-10 bg-gradient-to-tr from-racing-red to-red-600 skew-x-[-20deg]"></div>
                <h1 className="text-7xl font-display font-bold italic tracking-tighter text-white drop-shadow-2xl">
                    F1 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">MANAGER</span>
                </h1>
            </div>
            <p className="text-racing-neon tracking-[0.5em] font-mono text-sm uppercase">Official Team Principal Simulation</p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-4 w-80 mx-auto">
            <button 
                onClick={onNewGame}
                className="group relative px-8 py-4 bg-transparent border border-white/20 hover:border-racing-red hover:bg-racing-red/10 transition-all duration-300 rounded skew-x-[-10deg]"
            >
                <div className="skew-x-[10deg] font-display font-bold text-xl uppercase tracking-widest text-white group-hover:text-racing-red transition-colors">
                    New Career
                </div>
            </button>

            <button 
                onClick={onLoadGame}
                disabled={!hasSave}
                className={`group relative px-8 py-4 bg-transparent border border-white/20 transition-all duration-300 rounded skew-x-[-10deg]
                    ${hasSave ? 'hover:border-racing-neon hover:bg-racing-neon/10 cursor-pointer' : 'opacity-50 cursor-not-allowed border-white/5'}
                `}
            >
                <div className="skew-x-[10deg] font-display font-bold text-xl uppercase tracking-widest text-white group-hover:text-racing-neon transition-colors">
                    Continue
                </div>
            </button>

            <button 
                onClick={() => setShowOptions(true)}
                className="group relative px-8 py-4 bg-transparent border border-white/20 hover:border-white hover:bg-white/5 transition-all duration-300 rounded skew-x-[-10deg]"
            >
                <div className="skew-x-[10deg] font-display font-bold text-xl uppercase tracking-widest text-white transition-colors">
                    Options
                </div>
            </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-slate-500 font-mono text-xs">
         v1.0.0 • POWERED BY GEMINI • 2026 SEASON
      </div>

      {/* Options Modal */}
      {showOptions && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl max-w-md w-full shadow-2xl space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-display font-bold text-white border-b border-slate-800 pb-4">Options</h2>
                  
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-slate-300">Audio Effects</span>
                          <div className="w-12 h-6 bg-racing-neon rounded-full relative cursor-pointer">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                          </div>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-slate-300">Music Volume</span>
                          <input type="range" className="w-32 accent-racing-red" />
                      </div>
                       <div className="pt-4 border-t border-slate-800">
                          <button 
                             onClick={() => {
                                 localStorage.removeItem('f1ManagerSave');
                                 window.location.reload();
                             }}
                             className="text-red-500 text-sm hover:text-red-400 font-bold uppercase transition-colors"
                          >
                             Delete Saved Data
                          </button>
                      </div>
                  </div>

                  <button 
                    onClick={() => setShowOptions(false)}
                    className="w-full py-3 bg-white text-black font-bold uppercase rounded hover:bg-slate-200 transition-colors"
                  >
                      Close
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default MainMenu;