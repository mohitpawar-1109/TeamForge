import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const OfflineBanner = () => {
  const { isOnline } = usePwa();

  if (isOnline) return null;

  return (
    <div className="bg-[#A84A4D]/25 border-b border-[#A84A4D]/50 px-4 py-2 text-center text-xs font-semibold text-[#F6E8E2] flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md">
      <WifiOff className="w-3.5 h-3.5 text-[#CB6B5A] animate-pulse" />
      <span>
        <strong>Offline Mode:</strong> You are currently offline. Running cached app shell. Real-time updates will resume once connected.
      </span>
    </div>
  );
};
