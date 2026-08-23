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
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-[#888888] hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
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
