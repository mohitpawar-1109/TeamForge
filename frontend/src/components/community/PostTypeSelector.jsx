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
    color: 'text-brand-600 bg-brand-50 border-brand-200',
    badgeVariant: 'brand',
    placeholder: "What's on your mind? Share an idea, resource, or tech discovery..."
  },
  {
    id: 'LOOKING_FOR_TEAMMATES',
    label: 'Looking for Teammates',
    subtitle: 'Recruitment Request',
    icon: Users,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badgeVariant: 'warning',
    placeholder: "Describe your project or hackathon idea and what specific skills/roles you are looking for..."
  },
  {
    id: 'PROJECT',
    label: 'Project',
    subtitle: 'Showcase / Feedback',
    icon: FolderGit2,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    badgeVariant: 'purple',
    placeholder: "Share what you are building! Describe features, tech stack, and what feedback you need..."
  },
  {
    id: 'HACKATHON',
    label: 'Hackathon',
    subtitle: 'Events & Squads',
    icon: Trophy,
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    badgeVariant: 'purple',
    placeholder: "Announce an upcoming hackathon, dates, problem statement tracks, or team formation call..."
  },
  {
    id: 'QUESTION',
    label: 'Question',
    subtitle: 'Ask the Community',
    icon: HelpCircle,
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    badgeVariant: 'brand',
    placeholder: "Ask technical, architecture, or hackathon-related questions to get answers from fellow builders..."
  },
  {
    id: 'ACHIEVEMENT',
    label: 'Achievement',
    subtitle: 'Celebrate Wins',
    icon: Award,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
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
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/20'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};
