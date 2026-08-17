import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  MessageSquare,
  Award,
  Milestone,
  Calendar,
  Activity,
  BarChart3,
  Shield,
  Layers,
  ChevronRight,
  Flame,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { projectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const TeamPerformanceAnalytics = ({ projectId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members' | 'progress' | 'timeline'
  const { error } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await projectAPI.getAnalytics(projectId);
        if (res.data.success) {
          setAnalytics(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching team analytics:', err);
        error(err.response?.data?.message || 'Failed to load team analytics.');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalytics();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-[#18181B] border border-[#27272A] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-[#18181B] border border-[#27272A] rounded-3xl" />
          <div className="h-64 bg-[#18181B] border border-[#27272A] rounded-3xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center bg-[#18181B] border border-[#27272A] rounded-3xl text-zinc-400">
        <Activity className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
        <p>No analytics data available for this project yet.</p>
      </div>
    );
  }

  const { summary, priorityBreakdown, memberPerformance, activityTrend, milestones, timelineEvents } = analytics;

  // Calculate maximum activity value for trend chart scaling
  const maxTrendActivity = Math.max(
    ...activityTrend.map((d) => d.totalActivity),
    5
  );

  return (
    <div className="space-y-8">
      {/* Top Analytics Nav Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#27272A] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Team Performance & Project Velocity</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time execution analytics computed from sprint tasks, member contributions, and collaboration history.
          </p>
        </div>

        <div className="flex bg-[#18181B] p-1 rounded-2xl border border-[#27272A] gap-1">
          {[
            { id: 'overview', label: 'Team Overview', icon: BarChart3 },
            { id: 'members', label: 'Member Performance', icon: Users },
            { id: 'progress', label: 'Project Progress', icon: TrendingUp },
            { id: 'timeline', label: 'Activity Timeline', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TEAM OVERVIEW                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Progress Card */}
            <div className="p-5 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Overall Progress</span>
                <span className="p-2 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-500/30">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">{analytics.progress}%</span>
                <span className="text-xs text-emerald-400 font-bold">
                  {summary.completedTasks}/{summary.totalTasks} Tasks
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics.progress}%` }}
                />
              </div>
            </div>

            {/* Completed Tasks Card */}
            <div className="p-5 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tasks Completed</span>
                <span className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">{summary.completedTasks}</span>
                <span className="text-xs text-zinc-400">
                  {summary.totalTasks > 0
                    ? `${Math.round((summary.completedTasks / summary.totalTasks) * 100)}% completion`
                    : '0 tasks'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">
                {summary.inProgressTasks} currently in progress
              </p>
            </div>

            {/* Communication Volume Card */}
            <div className="p-5 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Team Chat Volume</span>
                <span className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                  <MessageSquare className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">{summary.totalMessages}</span>
                <span className="text-xs text-cyan-400 font-bold">Messages</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">
                Across {summary.totalMembers} active team members
              </p>
            </div>

            {/* Overdue / High Priority Alert Card */}
            <div className="p-5 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Priority Tasks</span>
                <span className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-500/30">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {priorityBreakdown.Urgent + priorityBreakdown.High}
                </span>
                <span className="text-xs text-rose-400 font-bold">
                  High / Urgent
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">
                {summary.overdueTasks > 0 ? `${summary.overdueTasks} tasks overdue` : 'All tasks on schedule'}
              </p>
            </div>
          </div>

          {/* Middle Row: 7-Day Activity Velocity Chart & Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Activity Trend Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>7-Day Team Activity Trend</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Daily breakdown of sprint task updates and team chat messages
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Tasks
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Chat
                  </span>
                </div>
              </div>

              {/* Responsive SVG / CSS Bar Chart */}
              <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
                {activityTrend.map((day, idx) => {
                  const taskHeight = (day.tasks / maxTrendActivity) * 100;
                  const msgHeight = (day.messages / maxTrendActivity) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 text-[10px] text-white px-2 py-1 rounded-lg absolute -top-2 pointer-events-none shadow-lg z-10 whitespace-nowrap">
                        {day.date}: {day.tasks} Tasks, {day.messages} Messages
                      </div>

                      {/* Stacked Bars */}
                      <div className="w-full max-w-[36px] bg-zinc-800/80 rounded-t-xl overflow-hidden flex flex-col justify-end h-36">
                        {/* Messages Bar */}
                        {day.messages > 0 && (
                          <div
                            className="w-full bg-cyan-500/80 hover:bg-cyan-400 transition-all rounded-t-lg"
                            style={{ height: `${Math.max(msgHeight, 8)}%` }}
                          />
                        )}
                        {/* Tasks Bar */}
                        {day.tasks > 0 && (
                          <div
                            className="w-full bg-indigo-600 hover:bg-indigo-500 transition-all"
                            style={{ height: `${Math.max(taskHeight, 8)}%` }}
                          />
                        )}
                        {day.tasks === 0 && day.messages === 0 && (
                          <div className="w-full h-1 bg-zinc-700/50" />
                        )}
                      </div>

                      {/* Day Label */}
                      <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors">
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Priority Distribution Donut / List */}
            <div className="p-6 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Task Priority Distribution</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Breakdown of backlog and active sprint priorities
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Urgent', count: priorityBreakdown.Urgent, color: 'bg-rose-500', text: 'text-rose-400' },
                  { label: 'High', count: priorityBreakdown.High, color: 'bg-amber-500', text: 'text-amber-400' },
                  { label: 'Medium', count: priorityBreakdown.Medium, color: 'bg-indigo-500', text: 'text-indigo-400' },
                  { label: 'Low', count: priorityBreakdown.Low, color: 'bg-zinc-500', text: 'text-zinc-400' }
                ].map((item) => {
                  const pct = summary.totalTasks > 0 ? Math.round((item.count / summary.totalTasks) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold flex items-center gap-2 ${item.text}`}>
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          {item.label} Priority
                        </span>
                        <span className="text-zinc-400 font-semibold">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Total Tracked Tasks:</span>
                <span className="text-white font-extrabold">{summary.totalTasks}</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Top Member Contribution Leaders */}
          <div className="p-6 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Team Contribution Leaderboard</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calculated based on completed tasks, active sprint velocity, and collaboration messages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Full Member View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberPerformance.slice(0, 3).map((member, idx) => (
                <div
                  key={member.memberId}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-10 h-10 rounded-xl object-cover bg-zinc-800 border border-zinc-700 flex-shrink-0"
                      />
                      {idx === 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black flex items-center justify-center shadow-md">
                          1
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white truncate">{member.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{member.role}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      {member.contributionShare}% Share
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {member.completedCount} Done • {member.messageCount} Chat
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEMBER PERFORMANCE                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberPerformance.map((member) => (
              <div
                key={member.memberId}
                className="p-6 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl space-y-5 flex flex-col justify-between"
              >
                {/* Member Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover bg-zinc-800 border border-zinc-700 shadow-md"
                    />
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{member.name}</h4>
                      <p className="text-xs text-indigo-400 font-semibold">{member.role}</p>
                      <p className="text-[11px] text-zinc-500 truncate max-w-[180px]">{member.headline}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 shadow-xs">
                    {member.contributionShare}%
                  </span>
                </div>

                {/* Progress & Completion Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Task Completion Rate</span>
                    <span className="text-white font-bold">{member.completionRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${member.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Member Stat Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
                  <div className="p-2.5 bg-zinc-900/60 rounded-xl text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Assigned</span>
                    <span className="text-sm font-black text-white">{member.assignedCount}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/60 rounded-xl text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Completed</span>
                    <span className="text-sm font-black text-emerald-400">{member.completedCount}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/60 rounded-xl text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Messages</span>
                    <span className="text-sm font-black text-cyan-400">{member.messageCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROJECT PROGRESS & MILESTONES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Milestone Stepper */}
          <div className="p-6 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Milestone className="w-4 h-4 text-indigo-400" />
                <span>Project Milestones & Delivery Roadmap</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automated progression tracking calibrated to sprint completion and delivery goals
              </p>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, idx) => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    milestone.completed
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-zinc-900/40 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                        milestone.completed
                          ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {milestone.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-extrabold ${
                          milestone.completed ? 'text-emerald-300' : 'text-white'
                        }`}
                      >
                        {milestone.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{milestone.description}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex-shrink-0 ${
                      milestone.completed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {milestone.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACTIVITY TIMELINE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="p-6 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Team Activity Event Stream</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified chronological log of sprint actions, task events, and member participation
            </p>
          </div>

          <div className="relative border-l-2 border-zinc-800 ml-4 pl-6 space-y-6">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-[#18181B] group-hover:scale-125 transition-transform" />

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      {evt.title}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(evt.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
