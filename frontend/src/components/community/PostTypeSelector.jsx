import React from 'react';
import {
  MessageSquare,
  FolderGit2,
  Trophy,
  HelpCircle,
  Award,
  Users
} from 'lucide-react';

export const POST_TYPES = [
  {
    id: 'TEXT',
    label: 'Post',
    subtitle: 'General Discussion',
    icon: MessageSquare,
    color: 'text-[#F6E8E2] bg-[#703344] border-[#A84A4D]/50',
    badgeVariant: 'brand',
    placeholder: "What's on your mind? Share an idea, resource, or tech discovery..."
  },
  {
    id: 'LOOKING_FOR_TEAMMATES',
    label: 'Looking for Teammates',
    subtitle: 'Recruitment Request',
    icon: Users,
    color: 'text-[#E5B079] bg-[#D99443]/20 border-[#D99443]/40',
    badgeVariant: 'warning',
    placeholder: "Describe your project or hackathon idea and what specific skills/roles you are looking for..."
  },
  {
    id: 'PROJECT',
    label: 'Project',
    subtitle: 'Showcase / Feedback',
    icon: FolderGit2,
    color: 'text-[#DDA081] bg-[#4A2A35] border-[#703344]',
    badgeVariant: 'peach',
    placeholder: "Share what you are building! Describe features, tech stack, and what feedback you need..."
  },
  {
    id: 'HACKATHON',
    label: 'Hackathon',
    subtitle: 'Events & Squads',
    icon: Trophy,
    color: 'text-[#E07D82] bg-[#C04A4D]/20 border-[#C04A4D]/40',
    badgeVariant: 'danger',
    placeholder: "Announce an upcoming hackathon, dates, problem statement tracks, or team formation call..."
  },
  {
    id: 'QUESTION',
    label: 'Question',
    subtitle: 'Ask the Community',
    icon: HelpCircle,
    color: 'text-[#DDA081] bg-[#4A2A35] border-[#703344]',
    badgeVariant: 'default',
    placeholder: "Ask technical, architecture, or hackathon-related questions to get answers from fellow builders..."
  },
  {
    id: 'ACHIEVEMENT',
    label: 'Achievement',
    subtitle: 'Celebrate Wins',
    icon: Award,
    color: 'text-[#86B190] bg-[#5B8A68]/20 border-[#5B8A68]/40',
    badgeVariant: 'success',
    placeholder: "Won a hackathon, finished a big project, or earned a certification? Share your milestone! 🎉"
  }
];

export const PostTypeSelector = ({ selectedType, onSelectType, size = 'default' }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {POST_TYPES.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelectType(type.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              isSelected
                ? 'bg-[#A84A4D] text-[#F6E8E2] border-[#CB6B5A]/60 shadow-sm shadow-[#A84A4D]/25'
                : 'bg-[#281A21] text-[#DDA081] border-[#703344] hover:bg-[#703344] hover:text-[#F6E8E2]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#F6E8E2]' : 'text-[#DDA081]'}`} />
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};
