import React, { useState, useEffect } from 'react';
import { Crown, Trophy, FolderGit2, Star, User, Activity, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [myRanking, setMyRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const [usersRes, myRankRes] = await Promise.all([
          api.get('/rankings/users?limit=50'),
          api.get('/rankings/me')
        ]);
        setUsers(usersRes.data.data);
        setMyRanking(myRankRes.data.data);
      } else {
        const res = await api.get('/rankings/projects?limit=50');
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1F1F1F] pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-mono tracking-tighter uppercase text-white mb-2">
            GLOBAL <span className="text-[#E50914]">RANKINGS</span>
          </h1>
          <p className="text-sm font-mono text-[#888888] max-w-xl">
            // ALGORITHMICALLY VERIFIED REPUTATION AND COLLABORATION SCORES.
            <br />
            // DRIVEN BY REAL FEEDBACK, SUCCESSFUL DEPLOYMENTS, AND SKILL VALIDATION.
          </p>
        </div>
        
        {/* Tab Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]' 
                : 'bg-[#111111] text-[#777777] border border-[#242424] hover:text-white hover:border-[#333333]'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            TOP USERS
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${
              activeTab === 'projects' 
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]' 
                : 'bg-[#111111] text-[#777777] border border-[#242424] hover:text-white hover:border-[#333333]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            TOP PROJECTS
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#E50914]/10 border border-[#E50914]/50 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E50914]" />
          <p className="text-sm text-[#E50914] font-mono">{error}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Leaderboard Table (3/4 width) */}
        <div className="lg:col-span-3">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-3xl overflow-hidden relative">
            
            {loading && (
              <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4" />
                <span className="font-mono text-xs text-[#888888] tracking-widest">// RECALCULATING_MATRIX...</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1F1F1F] bg-[#111111]/50">
                    <th className="p-4 text-xs font-mono font-bold text-[#888888] tracking-wider w-16 text-center">RANK</th>
                    <th className="p-4 text-xs font-mono font-bold text-[#888888] tracking-wider">{activeTab === 'users' ? 'USER' : 'PROJECT'}</th>
                    <th className="p-4 text-xs font-mono font-bold text-[#888888] tracking-wider text-right">REP_SCORE</th>
                    <th className="p-4 text-xs font-mono font-bold text-[#888888] tracking-wider text-right hidden sm:table-cell">RATING</th>
                    <th className="p-4 text-xs font-mono font-bold text-[#888888] tracking-wider text-right hidden md:table-cell">
                      {activeTab === 'users' ? 'VERIFIED_SKILLS' : 'REVIEWS'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {activeTab === 'users' ? (
                    users.map((u, i) => (
                      <tr 
                        key={u.user._id} 
                        className={`group transition-colors ${
                          myRanking?.user?._id === u.user._id ? 'bg-[#E50914]/5' : 'hover:bg-[#111111]'
                        }`}
                      >
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${
                            i === 0 ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40' :
                            i === 1 ? 'bg-[#C0C0C0]/20 text-[#C0C0C0] border border-[#C0C0C0]/40' :
                            i === 2 ? 'bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/40' :
                            'text-[#666666]'
                          }`}>
                            #{u.rank}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user.name}`} 
                              alt={u.user.name} 
                              className="w-10 h-10 rounded-full bg-[#111111] border border-[#242424]"
                            />
                            <div>
                              <div className="font-bold text-white text-sm group-hover:text-[#E50914] transition-colors">{u.user.name}</div>
                              <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider">{u.user.reputationLevel}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className="font-mono font-bold text-lg text-white">{u.reputationScore}</span>
                            <div className="w-16 h-1 bg-[#242424] rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-gradient-to-r from-white to-[#E50914]" 
                                style={{ width: `${u.reputationScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-1 text-[#E50914]">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-mono font-bold text-sm text-white">{u.averageRating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-sm text-[#888888] hidden md:table-cell">
                          {u.verifiedSkills}
                        </td>
                      </tr>
                    ))
                  ) : (
                    projects.map((p, i) => (
                      <tr key={p.project._id} className="group hover:bg-[#111111] transition-colors">
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${
                            i === 0 ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40' :
                            i === 1 ? 'bg-[#C0C0C0]/20 text-[#C0C0C0] border border-[#C0C0C0]/40' :
                            i === 2 ? 'bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/40' :
                            'text-[#666666]'
                          }`}>
                            #{p.rank}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="font-bold text-white text-sm group-hover:text-[#E50914] transition-colors truncate max-w-[200px] md:max-w-sm">{p.project.title}</div>
                            <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider">{p.project.category} // {p.completed ? 'COMPLETED' : 'IN PROGRESS'}</div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className="font-mono font-bold text-lg text-white">{p.reputationScore}</span>
                            <div className="w-16 h-1 bg-[#242424] rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-gradient-to-r from-white to-[#E50914]" 
                                style={{ width: `${p.reputationScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-1 text-[#E50914]">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-mono font-bold text-sm text-white">{p.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-sm text-[#888888] hidden md:table-cell">
                          {p.reviews}
                        </td>
                      </tr>
                    ))
                  )}
                  
                  {/* Empty States */}
                  {!loading && activeTab === 'users' && users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[#888888] font-mono text-sm">NO USERS FOUND.</td>
                    </tr>
                  )}
                  {!loading && activeTab === 'projects' && projects.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[#888888] font-mono text-sm">NO PROJECTS FOUND.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info (1/4 width) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* My Ranking Card */}
          {activeTab === 'users' && myRanking && (
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Crown className="w-24 h-24" />
              </div>
              
              <h3 className="text-[10px] font-mono tracking-widest text-[#888888] mb-4">// MY_RANKING</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={myRanking.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myRanking.user.name}`} 
                  alt="My Avatar" 
                  className="w-12 h-12 rounded-full border border-[#242424]"
                />
                <div>
                  <div className="font-bold text-white">{myRanking.user.name}</div>
                  <div className="text-[10px] font-mono text-[#E50914] uppercase tracking-wider">{myRanking.user.reputationLevel}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end pb-4 border-b border-[#1F1F1F]">
                  <span className="text-xs font-mono text-[#666666]">GLOBAL RANK</span>
                  <span className="font-mono text-2xl font-bold text-white">
                    {myRanking.rank ? `#${myRanking.rank}` : 'UNRANKED'}
                  </span>
                </div>
                
                <div className="flex justify-between items-end pb-4 border-b border-[#1F1F1F]">
                  <span className="text-xs font-mono text-[#666666]">REP SCORE</span>
                  <span className="font-mono text-xl font-bold text-white">{myRanking.reputationScore}</span>
                </div>
                
                <div className="flex justify-between items-end pb-4 border-b border-[#1F1F1F]">
                  <span className="text-xs font-mono text-[#666666]">AVG RATING</span>
                  <div className="flex items-center gap-1 text-[#E50914]">
                    <span className="font-mono text-lg font-bold text-white">{myRanking.averageRating.toFixed(1)}</span>
                    <Star className="w-3.5 h-3.5 fill-current mb-0.5" />
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-[#666666]">PROJECTS DONE</span>
                  <span className="font-mono text-lg font-bold text-white">{myRanking.completedProjects}</span>
                </div>
              </div>
            </div>
          )}

          {/* Algorithm Info Card */}
          <div className="bg-[#111111] border border-[#242424] rounded-3xl p-6">
            <h3 className="text-[10px] font-mono tracking-widest text-[#888888] mb-4">// SCORING_ALGORITHM</h3>
            <p className="text-xs text-[#A1A1A1] leading-relaxed mb-4">
              Reputation scores are calculated deterministically on the server using Bayesian smoothing (Wilson score confidence intervals) to prevent volatile swings from small review counts.
            </p>
            <ul className="space-y-2 text-[10px] font-mono text-[#666666]">
              <li className="flex gap-2"><span className="text-[#E50914]">01.</span> FEEDBACK: Max 40pts (Weighted for verified)</li>
              <li className="flex gap-2"><span className="text-[#E50914]">02.</span> SKILLS: Max 25pts (AI Verified only)</li>
              <li className="flex gap-2"><span className="text-[#E50914]">03.</span> PROJECTS: Max 15pts (Completed)</li>
              <li className="flex gap-2"><span className="text-[#E50914]">04.</span> COLLAB: Max 10pts (Category avg)</li>
              <li className="flex gap-2"><span className="text-[#E50914]">05.</span> ACTIVITY: Max 10pts (Tasks resolved)</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};
