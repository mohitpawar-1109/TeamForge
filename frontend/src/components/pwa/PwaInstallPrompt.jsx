import React from 'react';
import { Download, X } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaInstallPrompt = () => {
  const { isInstallable, isInstalled, showPromptBanner, promptInstall, dismissPrompt } = usePwa();

  if (!showPromptBanner || !isInstallable || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#4A2A35] border-2 border-[#703344] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle warm glow backdrop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#CB6B5A]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] flex items-center justify-center p-0.5 shadow-lg shadow-[#A84A4D]/30 flex-shrink-0">
              <img
                src="/icons/icon-192x192.svg"
                alt="TeamForge Icon"
                className="w-full h-full rounded-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-extrabold text-[#F6E8E2]">Install TeamForge</h4>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#281A21] text-[#DDA081] border border-[#703344]">
                  App
                </span>
              </div>
              <p className="text-xs text-[#DDA081] mt-0.5 leading-snug">
                Install as a native desktop or mobile app for instant launch & offline access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissPrompt}
            className="p-1 rounded-lg text-[#DDA081] hover:text-[#F6E8E2] hover:bg-[#703344] transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={promptInstall}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] hover:from-[#CB6B5A] hover:to-[#DDA081] text-[#F6E8E2] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#A84A4D]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Now</span>
          </button>

          <button
            type="button"
            onClick={dismissPrompt}
            className="py-2.5 px-3 bg-[#281A21] hover:bg-[#703344] text-[#DDA081] hover:text-[#F6E8E2] rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-[#703344]"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
