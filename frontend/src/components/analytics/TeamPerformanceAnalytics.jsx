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
        <div className="h-44 bg-[#4A2A35] border border-[#703344] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-[#4A2A35] border border-[#703344] rounded-3xl" />
          <div className="h-64 bg-[#4A2A35] border border-[#703344] rounded-3xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center bg-[#4A2A35] border border-[#703344] rounded-3xl text-[#DDA081]">
        <Activity className="w-10 h-10 text-[#703344] mx-auto mb-2" />
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
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#703344] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F6E8E2] tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#CB6B5A]" />
            <span>Team Performance & Project Velocity</span>
          </h2>
          <p className="text-xs text-[#DDA081] mt-0.5">
            Real-time execution analytics computed from sprint tasks, member contributions, and collaboration history.
          </p>
        </div>

        <div className="flex bg-[#281A21] p-1 rounded-2xl border border-[#703344] gap-1">
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
                    ? 'bg-[#A84A4D] text-[#F6E8E2] shadow-md shadow-[#A84A4D]/30'
                    : 'text-[#DDA081] hover:text-[#F6E8E2]'
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
            <div className="p-5 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#DDA081] uppercase tracking-wider">Overall Progress</span>
                <span className="p-2 rounded-xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#F6E8E2]">{analytics.progress}%</span>
                <span className="text-xs text-[#86B190] font-bold">
                  {summary.completedTasks}/{summary.totalTasks} Tasks
                </span>
              </div>
              <div className="w-full bg-[#281A21] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics.progress}%` }}
                />
              </div>
            </div>

            {/* Completed Tasks Card */}
            <div className="p-5 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#DDA081] uppercase tracking-wider">Tasks Completed</span>
                <span className="p-2 rounded-xl bg-[#5B8A68]/20 text-[#86B190] border border-[#5B8A68]/40">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#F6E8E2]">{summary.completedTasks}</span>
                <span className="text-xs text-[#DDA081]">
                  {summary.totalTasks > 0
                    ? `${Math.round((summary.completedTasks / summary.totalTasks) * 100)}% completion`
                    : '0 tasks'}
                </span>
              </div>
              <p className="text-[11px] text-[#DDA081] mt-2 font-medium">
                {summary.inProgressTasks} currently in progress
              </p>
            </div>

            {/* Communication Volume Card */}
            <div className="p-5 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#DDA081] uppercase tracking-wider">Team Chat Volume</span>
                <span className="p-2 rounded-xl bg-[#703344] text-[#DDA081] border border-[#703344]">
                  <MessageSquare className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#F6E8E2]">{summary.totalMessages}</span>
                <span className="text-xs text-[#CB6B5A] font-bold">Messages</span>
              </div>
              <p className="text-[11px] text-[#DDA081] mt-2 font-medium">
                Across {summary.totalMembers} active team members
              </p>
            </div>

            {/* Overdue / High Priority Alert Card */}
            <div className="p-5 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#DDA081] uppercase tracking-wider">Priority Tasks</span>
                <span className="p-2 rounded-xl bg-[#C04A4D]/20 text-[#E07D82] border border-[#C04A4D]/40">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#F6E8E2]">
                  {priorityBreakdown.Urgent + priorityBreakdown.High}
                </span>
                <span className="text-xs text-[#E07D82] font-bold">
                  High / Urgent
                </span>
              </div>
              <p className="text-[11px] text-[#DDA081] mt-2 font-medium">
                {summary.overdueTasks > 0 ? `${summary.overdueTasks} tasks overdue` : 'All tasks on schedule'}
              </p>
            </div>
          </div>

          {/* Middle Row: 7-Day Activity Velocity Chart & Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Activity Trend Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#F6E8E2] tracking-tight flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#CB6B5A]" />
                    <span>7-Day Team Activity Trend</span>
                  </h3>
                  <p className="text-xs text-[#DDA081] mt-0.5">
                    Daily breakdown of sprint task updates and team chat messages
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-[#CB6B5A] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A84A4D]" /> Tasks
                  </span>
                  <span className="flex items-center gap-1.5 text-[#DDA081] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#703344]" /> Chat
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
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#281A21] border border-[#703344] text-[10px] text-[#F6E8E2] px-2 py-1 rounded-lg absolute -top-2 pointer-events-none shadow-lg z-10 whitespace-nowrap">
                        {day.date}: {day.tasks} Tasks, {day.messages} Messages
                      </div>

                      {/* Stacked Bars */}
                      <div className="w-full max-w-[36px] bg-[#281A21] rounded-t-xl overflow-hidden flex flex-col justify-end h-36">
                        {/* Messages Bar */}
                        {day.messages > 0 && (
                          <div
                            className="w-full bg-[#703344] hover:bg-[#DDA081] transition-all rounded-t-lg"
                            style={{ height: `${Math.max(msgHeight, 8)}%` }}
                          />
                        )}
                        {/* Tasks Bar */}
                        {day.tasks > 0 && (
                          <div
                            className="w-full bg-[#A84A4D] hover:bg-[#CB6B5A] transition-all"
                            style={{ height: `${Math.max(taskHeight, 8)}%` }}
                          />
                        )}
                        {day.tasks === 0 && day.messages === 0 && (
                          <div className="w-full h-1 bg-[#703344]/50" />
                        )}
                      </div>

                      {/* Day Label */}
                      <span className="text-[11px] font-bold text-[#DDA081] group-hover:text-[#F6E8E2] transition-colors">
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Priority Distribution Donut / List */}
            <div className="p-6 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#F6E8E2] tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#CB6B5A]" />
                  <span>Task Priority Distribution</span>
                </h3>
                <p className="text-xs text-[#DDA081] mt-0.5">
                  Breakdown of backlog and active sprint priorities
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Urgent', count: priorityBreakdown.Urgent, color: 'bg-[#C04A4D]', text: 'text-[#E07D82]' },
                  { label: 'High', count: priorityBreakdown.High, color: 'bg-[#D99443]', text: 'text-[#E5B079]' },
                  { label: 'Medium', count: priorityBreakdown.Medium, color: 'bg-[#CB6B5A]', text: 'text-[#CB6B5A]' },
                  { label: 'Low', count: priorityBreakdown.Low, color: 'bg-[#703344]', text: 'text-[#DDA081]' }
                ].map((item) => {
                  const pct = summary.totalTasks > 0 ? Math.round((item.count / summary.totalTasks) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold flex items-center gap-2 ${item.text}`}>
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          {item.label} Priority
                        </span>
                        <span className="text-[#DDA081] font-semibold">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#281A21] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-[#281A21] rounded-2xl border border-[#703344] text-[11px] text-[#DDA081] flex items-center justify-between">
                <span>Total Tracked Tasks:</span>
                <span className="text-[#F6E8E2] font-extrabold">{summary.totalTasks}</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Top Member Contribution Leaders */}
          <div className="p-6 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#F6E8E2] tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#CB6B5A]" />
                  <span>Team Contribution Leaderboard</span>
                </h3>
                <p className="text-xs text-[#DDA081] mt-0.5">
                  Calculated based on completed tasks, active sprint velocity, and collaboration messages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className="text-xs font-bold text-[#CB6B5A] hover:text-[#DDA081] flex items-center gap-1 cursor-pointer"
              >
                <span>Full Member View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberPerformance.slice(0, 3).map((member, idx) => (
                <div
                  key={member.memberId}
                  className="p-4 rounded-2xl bg-[#281A21] border border-[#703344] flex items-center justify-between gap-3 hover:border-[#A84A4D]/50 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-10 h-10 rounded-xl object-cover bg-[#4A2A35] border border-[#703344] flex-shrink-0"
                      />
                      {idx === 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#CB6B5A] text-[#281A21] text-[10px] font-black flex items-center justify-center shadow-md">
                          1
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#F6E8E2] truncate">{member.name}</p>
                      <p className="text-[11px] text-[#DDA081] truncate">{member.role}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40">
                      {member.contributionShare}% Share
                    </span>
                    <p className="text-[10px] text-[#DDA081] mt-1">
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
                className="p-6 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl space-y-5 flex flex-col justify-between"
              >
                {/* Member Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover bg-[#281A21] border border-[#703344] shadow-md"
                    />
                    <div>
                      <h4 className="text-sm font-extrabold text-[#F6E8E2]">{member.name}</h4>
                      <p className="text-xs text-[#CB6B5A] font-semibold">{member.role}</p>
                      <p className="text-[11px] text-[#DDA081] truncate max-w-[180px]">{member.headline}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40 shadow-xs">
                    {member.contributionShare}%
                  </span>
                </div>

                {/* Progress & Completion Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#DDA081] font-medium">Task Completion Rate</span>
                    <span className="text-[#F6E8E2] font-bold">{member.completionRate}%</span>
                  </div>
                  <div className="w-full bg-[#281A21] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#5B8A68] to-[#86B190] h-full rounded-full transition-all duration-300"
                      style={{ width: `${member.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Member Stat Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#703344]">
                  <div className="p-2.5 bg-[#281A21] rounded-xl text-center">
                    <span className="text-[10px] text-[#DDA081] uppercase font-bold block">Assigned</span>
                    <span className="text-sm font-black text-[#F6E8E2]">{member.assignedCount}</span>
                  </div>
                  <div className="p-2.5 bg-[#281A21] rounded-xl text-center">
                    <span className="text-[10px] text-[#DDA081] uppercase font-bold block">Completed</span>
                    <span className="text-sm font-black text-[#86B190]">{member.completedCount}</span>
                  </div>
                  <div className="p-2.5 bg-[#281A21] rounded-xl text-center">
                    <span className="text-[10px] text-[#DDA081] uppercase font-bold block">Messages</span>
                    <span className="text-sm font-black text-[#CB6B5A]">{member.messageCount}</span>
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
          <div className="p-6 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-[#F6E8E2] tracking-tight flex items-center gap-2">
                <Milestone className="w-4 h-4 text-[#CB6B5A]" />
                <span>Project Milestones & Delivery Roadmap</span>
              </h3>
              <p className="text-xs text-[#DDA081] mt-0.5">
                Automated progression tracking calibrated to sprint completion and delivery goals
              </p>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, idx) => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    milestone.completed
                      ? 'bg-[#5B8A68]/20 border-[#5B8A68]/40'
                      : 'bg-[#281A21] border-[#703344]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                        milestone.completed
                          ? 'bg-[#5B8A68] text-white shadow-md shadow-[#5B8A68]/30'
                          : 'bg-[#703344] text-[#DDA081]'
                      }`}
                    >
                      {milestone.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-extrabold ${
                          milestone.completed ? 'text-[#86B190]' : 'text-[#F6E8E2]'
                        }`}
                      >
                        {milestone.title}
                      </h4>
                      <p className="text-xs text-[#DDA081] mt-0.5">{milestone.description}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex-shrink-0 ${
                      milestone.completed
                        ? 'bg-[#5B8A68]/20 text-[#86B190] border border-[#5B8A68]/40'
                        : 'bg-[#703344] text-[#DDA081]'
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
        <div className="p-6 rounded-3xl bg-[#4A2A35] border border-[#703344] shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-[#F6E8E2] tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#CB6B5A]" />
              <span>Team Activity Event Stream</span>
            </h3>
            <p className="text-xs text-[#DDA081] mt-0.5">
              Verified chronological log of sprint actions, task events, and member participation
            </p>
          </div>

          <div className="relative border-l-2 border-[#703344] ml-4 pl-6 space-y-6">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#A84A4D] border-4 border-[#281A21] group-hover:scale-125 transition-transform" />

                <div className="p-4 rounded-2xl bg-[#281A21] border border-[#703344] group-hover:border-[#A84A4D]/50 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[#F6E8E2] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#CB6B5A]" />
                      {evt.title}
                    </span>
                    <span className="text-[10px] text-[#DDA081]">
                      {new Date(evt.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[#DDA081]">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
