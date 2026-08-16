import React from 'react';
import {
  MessageSquare,
  FolderGit2,
  Trophy,
  HelpCircle,
  Award,
  Users,
  Sparkles
} from 'lucide-react';

export const POST_TYPES = [
  {
    id: 'TEXT',
    label: 'Post',
    subtitle: 'General Discussion',
    icon: MessageSquare,
    color: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30',
    badgeVariant: 'brand',
    placeholder: "What's on your mind? Share an idea, resource, or tech discovery..."
  },
  {
    id: 'LOOKING_FOR_TEAMMATES',
    label: 'Looking for Teammates',
    subtitle: 'Recruitment Request',
    icon: Users,
    color: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
    badgeVariant: 'warning',
    placeholder: "Describe your project or hackathon idea and what specific skills/roles you are looking for..."
  },
  {
    id: 'PROJECT',
    label: 'Project',
    subtitle: 'Showcase / Feedback',
    icon: FolderGit2,
    color: 'text-purple-400 bg-purple-950/60 border-purple-500/30',
    badgeVariant: 'purple',
    placeholder: "Share what you are building! Describe features, tech stack, and what feedback you need..."
  },
  {
    id: 'HACKATHON',
    label: 'Hackathon',
    subtitle: 'Events & Squads',
    icon: Trophy,
    color: 'text-pink-400 bg-pink-950/60 border-pink-500/30',
    badgeVariant: 'purple',
    placeholder: "Announce an upcoming hackathon, dates, problem statement tracks, or team formation call..."
  },
  {
    id: 'QUESTION',
    label: 'Question',
    subtitle: 'Ask the Community',
    icon: HelpCircle,
    color: 'text-sky-400 bg-sky-950/60 border-sky-500/30',
    badgeVariant: 'brand',
    placeholder: "Ask technical, architecture, or hackathon-related questions to get answers from fellow builders..."
  },
  {
    id: 'ACHIEVEMENT',
    label: 'Achievement',
    subtitle: 'Celebrate Wins',
    icon: Award,
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
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
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                : 'bg-[#18181B] text-zinc-400 border-[#27272A] hover:bg-[#27272A] hover:text-[#FAFAFA]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};
