import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TeamVideoMeeting } from '../components/video/TeamVideoMeeting';
import { ArrowLeft } from 'lucide-react';

export const MeetingPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-4 py-2 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Previous Page</span>
        </button>
      </div>

      <TeamVideoMeeting
        roomId={roomId}
        onLeave={() => navigate(-1)}
      />
    </div>
  );
};
