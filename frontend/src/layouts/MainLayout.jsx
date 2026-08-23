import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Compass,
  Mail,
  Users,
  User,
  Settings,
  PlusCircle,
  Bell,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Network,
  Search,
  Trophy,
  Download,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import { NotificationDropdown } from '../components/navigation/NotificationDropdown';

export const MainLayout = () => {
  const { user, logout, quickSwitchDemoUser } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePwa();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/projects?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Hackathons', path: '/hackathons', icon: Trophy, badge: 'Prizes' },
    { label: 'Groups & Chat', path: '/groups', icon: Users, badge: 'Live' },
    { label: 'Community', path: '/community', icon: MessageSquare },
    { label: 'Explore', path: '/projects', icon: Compass },
    { label: 'Skill Network', path: '/network', icon: Network },
    { label: 'My Projects', path: '/my-projects', icon: FolderGit2 },
    { label: 'Invitations', path: '/invitations', icon: Mail },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex">
      {/* Desktop Nothing OS Sidebar */}
      <aside className="hidden lg:flex flex-col w-[265px] border-r border-[#1F1F1F] bg-[#050505] sticky top-0 h-screen z-30 justify-between select-none">
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#1F1F1F] gap-3">
            <div className="w-5 h-5 rounded-full bg-[#111111] border border-[#242424] flex items-center justify-center relative">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.8)]"></span>
            </div>
            <Link to="/dashboard" className="text-sm font-bold font-mono tracking-wider text-white">
              TEAM <span className="text-[#E50914]">(FORGE)</span>
            </Link>
          </div>

          {/* Quick Create Action Button */}
          <div className="px-4 pt-4 pb-2">
            <Link to="/projects/create" className="block">
              <button
                type="button"
                className="w-full bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-full py-2.5 px-4 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
              >
                <PlusCircle className="w-3.5 h-3.5 text-black" />
                <span>+ NEW PROJECT</span>
              </button>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/projects' && location.pathname.startsWith('/projects') && location.pathname !== '/projects/create' && location.pathname !== '/my-projects');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-[#888888] hover:text-white hover:bg-[#111111]/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-[#E50914] flex-shrink-0 shadow-[0_0_6px_rgba(229,9,20,0.8)]"></span>
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-[#777777] flex-shrink-0" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight font-bold ${
                        isActive
                          ? 'bg-[#E50914] text-white'
                          : item.badge === 'Live'
                          ? 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40'
                          : 'bg-[#161616] text-[#A1A1A1] border border-[#242424]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {/* PWA Install Button in Nav */}
            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={promptInstall}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-mono font-bold text-[#20D47A] bg-[#20D47A]/10 border border-[#20D47A]/30 hover:bg-[#20D47A]/20 transition-all cursor-pointer mt-2"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-[#20D47A]" />
                  <span>INSTALL PWA</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider bg-[#20D47A]/20 text-[#20D47A] px-1.5 py-0.5 rounded-full font-mono">
                  APP
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* User Card & Demo Switcher at Bottom */}
        <div className="p-4 border-t border-[#1F1F1F] bg-[#050505]">
          <div className="flex items-center justify-between mb-3">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0 group">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-[#242424] bg-[#111111] flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#F5F5F5] group-hover:text-white truncate">{user?.name || 'Mohit'}</p>
                <p className="text-[10px] font-mono text-[#666666] truncate">// {user?.course || 'Computer Science'}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-[#666666] hover:text-[#E50914] hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Demo Switcher */}
          <div className="pt-2 border-t border-[#1F1F1F]">
            <span className="text-[10px] font-mono text-[#666666] block mb-1.5 tracking-wider">
              // SWITCH_DEMO:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => quickSwitchDemoUser('mohit@teamforge.app')}
                className={`text-[10px] font-mono py-1 rounded-md border transition-all cursor-pointer ${
                  user?.email === 'mohit@teamforge.app'
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-[#111111] text-[#777777] border-[#242424] hover:text-white hover:border-[#333333]'
                }`}
              >
                MOHIT
              </button>
              <button
                type="button"
                onClick={() => quickSwitchDemoUser('priya@teamforge.app')}
                className={`text-[10px] font-mono py-1 rounded-md border transition-all cursor-pointer ${
                  user?.email === 'priya@teamforge.app'
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-[#111111] text-[#777777] border-[#242424] hover:text-white hover:border-[#333333]'
                }`}
              >
                PRIYA
              </button>
              <button
                type="button"
                onClick={() => quickSwitchDemoUser('aarav@teamforge.app')}
                className={`text-[10px] font-mono py-1 rounded-md border transition-all cursor-pointer ${
                  user?.email === 'aarav@teamforge.app'
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-[#111111] text-[#777777] border-[#242424] hover:text-white hover:border-[#333333]'
                }`}
              >
                AARAV
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-[#050505]/95 backdrop-blur-md border-b border-[#1F1F1F] px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#A1A1A1] hover:bg-[#161616] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-mono font-bold text-white text-sm">
              TEAM <span className="text-[#E50914]">(FORGE)</span>
            </span>
          </div>

          {/* Global Technical Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-lg relative">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="[ SEARCH_PROJECTS_SKILLS_STUDENTS_ ]"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-[#111111] border border-[#242424] text-[#F5F5F5] placeholder-[#555555] rounded-full focus:bg-[#161616] focus:border-[#E50914] focus:outline-none transition-all"
            />
          </form>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* User Avatar */}
            <Link to="/profile" className="flex items-center gap-2 pl-1 group">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-7 h-7 rounded-full object-cover border border-[#242424] bg-[#111111]"
              />
              <span className="hidden sm:inline-block text-xs font-medium text-[#A1A1A1] group-hover:text-white max-w-[120px] truncate">
                {user?.name || 'Mohit'}
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-68 bg-[#0A0A0A] border-r border-[#1F1F1F] h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#1F1F1F] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E50914]"></span>
                    <span className="font-mono font-bold text-white text-sm">TEAM (FORGE)</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-[#888888]" /></button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-mono ${
                          isActive
                            ? 'bg-white text-black font-bold'
                            : 'text-[#888888] hover:bg-[#161616] hover:text-white'
                        }`}
                      >
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-[#E50914]"></span>
                        ) : (
                          <Icon className="w-4 h-4 text-[#666666]" />
                        )}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 p-3 text-[#E50914] hover:bg-[#161616] rounded-xl text-xs font-mono"
              >
                <LogOut className="w-4 h-4" />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content Outlet */}
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#050505]/95 backdrop-blur-md border-t border-[#1F1F1F] z-30 flex items-center justify-around px-2">
        <Link to="/dashboard" className={`flex flex-col items-center gap-1 text-[10px] font-mono ${location.pathname === '/dashboard' ? 'text-white font-bold' : 'text-[#777777] hover:text-white'}`}>
          <LayoutDashboard className="w-4 h-4" />
          <span>HOME</span>
        </Link>
        <Link to="/groups" className={`flex flex-col items-center gap-1 text-[10px] font-mono ${location.pathname.startsWith('/groups') ? 'text-white font-bold' : 'text-[#777777] hover:text-white'}`}>
          <Users className="w-4 h-4" />
          <span>CHAT</span>
        </Link>
        <Link to="/projects/create" className="flex flex-col items-center gap-1 text-[10px] font-mono text-white">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
            <Plus className="w-4 h-4 text-black" />
          </div>
          <span>NEW</span>
        </Link>
        <Link to="/projects" className={`flex flex-col items-center gap-1 text-[10px] font-mono ${location.pathname === '/projects' ? 'text-white font-bold' : 'text-[#777777] hover:text-white'}`}>
          <Compass className="w-4 h-4" />
          <span>EXPLORE</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 text-[10px] font-mono ${location.pathname === '/profile' ? 'text-white font-bold' : 'text-[#777777] hover:text-white'}`}>
          <User className="w-4 h-4" />
          <span>PROFILE</span>
        </Link>
      </div>
    </div>
  );
};
