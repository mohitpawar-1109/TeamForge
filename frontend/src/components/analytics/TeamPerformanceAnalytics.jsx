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
  const [activeTab, setActiveTab] = useState('overview');
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
        <div className="h-44 bg-[#111111] border border-[#242424] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-[#111111] border border-[#242424] rounded-3xl" />
          <div className="h-64 bg-[#111111] border border-[#242424] rounded-3xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center bg-[#111111] border border-[#242424] rounded-3xl text-[#888888]">
        <Activity className="w-10 h-10 text-[#333333] mx-auto mb-2" />
        <p className="font-mono text-xs">No analytics data available for this project yet.</p>
      </div>
    );
  }

  const { summary, priorityBreakdown, memberPerformance, activityTrend, milestones, timelineEvents } = analytics;

  const maxTrendActivity = Math.max(
    ...activityTrend.map((d) => d.totalActivity),
    5
  );

  return (
    <div className="space-y-8">
      {/* Top Analytics Nav Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5] tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#E50914]" />
            <span>Team Performance & Project Velocity</span>
          </h2>
          <p className="text-xs font-mono text-[#888888] mt-0.5">
            Real-time execution analytics computed from sprint tasks, member contributions, and collaboration history.
          </p>
        </div>

        <div className="flex bg-[#161616] p-1 rounded-full border border-[#242424] gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'timeline', label: 'Timeline', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-soft'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: TEAM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Overall Progress</span>
                <span className="p-1.5 rounded-full bg-[#161616] text-[#E50914] border border-[#242424]">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#F5F5F5]">{analytics.progress}%</span>
                <span className="text-xs font-mono text-[#20D47A] font-bold">
                  {summary.completedTasks}/{summary.totalTasks} Tasks
                </span>
              </div>
              <div className="w-full bg-[#161616] h-1.5 rounded-full mt-3 overflow-hidden border border-[#242424]">
                <div
                  className="bg-[#E50914] h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics.progress}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Tasks Completed</span>
                <span className="p-1.5 rounded-full bg-[#161616] text-[#20D47A] border border-[#242424]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#F5F5F5]">{summary.completedTasks}</span>
                <span className="text-xs font-mono text-[#888888]">
                  {summary.totalTasks > 0
                    ? `${Math.round((summary.completedTasks / summary.totalTasks) * 100)}% completion`
                    : '0 tasks'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#666666] mt-2">
                {summary.inProgressTasks} currently in progress
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Team Chat Volume</span>
                <span className="p-1.5 rounded-full bg-[#161616] text-[#2AA8FF] border border-[#242424]">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#F5F5F5]">{summary.totalMessages}</span>
                <span className="text-xs font-mono text-[#888888]">Messages</span>
              </div>
              <p className="text-[11px] font-mono text-[#666666] mt-2">
                Across {summary.totalMembers} active team members
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Priority Tasks</span>
                <span className="p-1.5 rounded-full bg-[#161616] text-[#FF1F2D] border border-[#242424]">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#F5F5F5]">
                  {priorityBreakdown.Urgent + priorityBreakdown.High}
                </span>
                <span className="text-xs font-mono text-[#FF1F2D] font-bold">
                  High / Urgent
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#666666] mt-2">
                {summary.overdueTasks > 0 ? `${summary.overdueTasks} tasks overdue` : 'All tasks on schedule'}
              </p>
            </div>
          </div>

          {/* Middle Row: 7-Day Activity Velocity Chart & Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#E50914]" />
                    <span>7-Day Team Activity Trend</span>
                  </h3>
                  <p className="text-xs font-mono text-[#888888] mt-0.5">
                    Daily breakdown of sprint task updates and team chat messages
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-[#E50914] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#E50914]" /> Tasks
                  </span>
                  <span className="flex items-center gap-1.5 text-[#888888] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#333333]" /> Chat
                  </span>
                </div>
              </div>

              <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
                {activityTrend.map((day, idx) => {
                  const taskHeight = (day.tasks / maxTrendActivity) * 100;
                  const msgHeight = (day.messages / maxTrendActivity) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="w-full max-w-[36px] bg-[#161616] rounded-t-xl overflow-hidden flex flex-col justify-end h-36">
                        {day.messages > 0 && (
                          <div
                            className="w-full bg-[#333333] hover:bg-[#555555] transition-all"
                            style={{ height: `${Math.max(msgHeight, 8)}%` }}
                          />
                        )}
                        {day.tasks > 0 && (
                          <div
                            className="w-full bg-[#E50914] hover:bg-[#FF1F2D] transition-all"
                            style={{ height: `${Math.max(taskHeight, 8)}%` }}
                          />
                        )}
                        {day.tasks === 0 && day.messages === 0 && (
                          <div className="w-full h-1 bg-[#242424]" />
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-[#888888] group-hover:text-white transition-colors">
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Priority Distribution */}
            <div className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#E50914]" />
                  <span>Task Priority Distribution</span>
                </h3>
                <p className="text-xs font-mono text-[#888888] mt-0.5">
                  Breakdown of backlog and active sprint priorities
                </p>
              </div>

              <div className="space-y-3 font-mono">
                {[
                  { label: 'Urgent', count: priorityBreakdown.Urgent, color: 'bg-[#FF1F2D]', text: 'text-[#FF1F2D]' },
                  { label: 'High', count: priorityBreakdown.High, color: 'bg-[#F2B705]', text: 'text-[#F2B705]' },
                  { label: 'Medium', count: priorityBreakdown.Medium, color: 'bg-[#2AA8FF]', text: 'text-[#2AA8FF]' },
                  { label: 'Low', count: priorityBreakdown.Low, color: 'bg-[#666666]', text: 'text-[#888888]' }
                ].map((item) => {
                  const pct = summary.totalTasks > 0 ? Math.round((item.count / summary.totalTasks) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold flex items-center gap-2 ${item.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                          {item.label}
                        </span>
                        <span className="text-[#888888]">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#161616] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-[#161616] rounded-2xl border border-[#242424] text-[10px] font-mono text-[#888888] flex items-center justify-between">
                <span>Total Tracked Tasks:</span>
                <span className="text-[#F5F5F5] font-bold">{summary.totalTasks}</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Top Member Contribution Leaders */}
          <div className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#E50914]" />
                  <span>Team Contribution Leaderboard</span>
                </h3>
                <p className="text-xs font-mono text-[#888888] mt-0.5">
                  Calculated based on completed tasks, active sprint velocity, and collaboration messages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className="text-xs font-mono font-bold text-[#E50914] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Full Member View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberPerformance.slice(0, 3).map((member, idx) => (
                <div
                  key={member.memberId}
                  className="p-4 rounded-2xl bg-[#161616] border border-[#242424] flex items-center justify-between gap-3 hover:border-[#333333] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover bg-[#111111] border border-[#242424] flex-shrink-0"
                      />
                      {idx === 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-black text-[9px] font-mono font-bold flex items-center justify-center shadow-md">
                          1
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-[#F5F5F5] truncate">{member.name}</p>
                      <p className="text-[10px] font-mono text-[#888888] truncate">{member.role}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#111111] text-[#F5F5F5] border border-[#242424]">
                      {member.contributionShare}% Share
                    </span>
                    <p className="text-[10px] text-[#666666] mt-1">
                      {member.completedCount} Done • {member.messageCount} Chat
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBER PERFORMANCE */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberPerformance.map((member) => (
              <div
                key={member.memberId}
                className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft space-y-5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover bg-[#161616] border border-[#242424]"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#F5F5F5]">{member.name}</h4>
                      <p className="text-xs font-mono text-[#E50914]">{member.role}</p>
                      <p className="text-[10px] font-mono text-[#888888] truncate max-w-[180px]">{member.headline}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#161616] text-[#F5F5F5] border border-[#242424]">
                    {member.contributionShare}%
                  </span>
                </div>

                <div className="space-y-2 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#888888]">Task Completion Rate</span>
                    <span className="text-[#20D47A] font-bold">{member.completionRate}%</span>
                  </div>
                  <div className="w-full bg-[#161616] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#20D47A] h-full rounded-full transition-all duration-300"
                      style={{ width: `${member.completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1F1F1F] font-mono">
                  <div className="p-2.5 bg-[#161616] rounded-2xl text-center">
                    <span className="text-[9px] text-[#888888] uppercase font-bold block">Assigned</span>
                    <span className="text-sm font-bold text-[#F5F5F5]">{member.assignedCount}</span>
                  </div>
                  <div className="p-2.5 bg-[#161616] rounded-2xl text-center">
                    <span className="text-[9px] text-[#888888] uppercase font-bold block">Completed</span>
                    <span className="text-sm font-bold text-[#20D47A]">{member.completedCount}</span>
                  </div>
                  <div className="p-2.5 bg-[#161616] rounded-2xl text-center">
                    <span className="text-[9px] text-[#888888] uppercase font-bold block">Messages</span>
                    <span className="text-sm font-bold text-[#2AA8FF]">{member.messageCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT PROGRESS & MILESTONES */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft space-y-6">
            <div>
              <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Milestone className="w-4 h-4 text-[#E50914]" />
                <span>Project Milestones & Delivery Roadmap</span>
              </h3>
              <p className="text-xs font-mono text-[#888888] mt-0.5">
                Automated progression tracking calibrated to sprint completion and delivery goals
              </p>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone, idx) => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    milestone.completed
                      ? 'bg-[#20D47A]/5 border-[#20D47A]/30'
                      : 'bg-[#161616] border-[#242424]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 ${
                        milestone.completed
                          ? 'bg-[#20D47A] text-black'
                          : 'bg-[#242424] text-[#888888]'
                      }`}
                    >
                      {milestone.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold font-mono ${
                          milestone.completed ? 'text-[#20D47A]' : 'text-[#F5F5F5]'
                        }`}
                      >
                        {milestone.title}
                      </h4>
                      <p className="text-[11px] font-mono text-[#888888] mt-0.5">{milestone.description}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider flex-shrink-0 ${
                      milestone.completed
                        ? 'bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30'
                        : 'bg-[#111111] text-[#666666] border border-[#242424]'
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

      {/* TAB 4: ACTIVITY TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft space-y-6">
          <div>
            <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E50914]" />
              <span>Team Activity Event Stream</span>
            </h3>
            <p className="text-xs font-mono text-[#888888] mt-0.5">
              Verified chronological log of sprint actions, task events, and member participation
            </p>
          </div>

          <div className="relative border-l border-[#242424] ml-4 pl-6 space-y-4">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[30px] top-2.5 w-2.5 h-2.5 rounded-full bg-[#E50914]" />

                <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424] hover:border-[#333333] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-[#F5F5F5] flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[#E50914]" />
                      {evt.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#666666]">
                      {new Date(evt.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#888888]">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
