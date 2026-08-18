import React, { useState } from 'react';
import { Download, X, Sparkles, Smartphone, Check, ChevronUp } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaInstallPrompt = () => {
  const { isInstallable, isInstalled, showPromptBanner, promptInstall, dismissPrompt } = usePwa();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!showPromptBanner || !isInstallable || isInstalled) {
    return null;
  }

  // Minimized floating badge
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-40 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="px-3 py-1.5 bg-[#18181B]/95 hover:bg-[#27272A] border border-indigo-500/40 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-2 text-xs font-bold text-indigo-300 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-[#18181B]/95 border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white truncate">Install TeamForge</h5>
              <p className="text-[11px] text-zinc-400 truncate">Offline access & quick launch</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={promptInstall}
              className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Minimize"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
