import React, { useState, useEffect } from 'react';
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
  Layers,
  CheckCircle2,
  MessageSquare,
  Network,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { NotificationDropdown } from '../components/navigation/NotificationDropdown';

export const MainLayout = () => {
  const { user, logout, quickSwitchDemoUser } = useAuth();
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
    { label: 'Groups & Chat', path: '/groups', icon: Users, badge: 'Live' },
    { label: 'Community', path: '/community', icon: MessageSquare },
    { label: 'Explore', path: '/projects', icon: Compass },
    { label: 'Skill Network', path: '/network', icon: Network },
    { label: 'My Projects', path: '/my-projects', icon: FolderGit2 },
    {
      label: 'Invitations',
      path: '/invitations',
      icon: Mail
    },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#27272A] bg-[#18181B] sticky top-0 h-screen z-30 justify-between">
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#27272A] gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              TEAM<span className="text-indigo-400">FORGE</span>
            </span>
          </div>

          {/* Quick Create Action */}
          <div className="p-4">
            <Link to="/projects/create">
              <Button variant="gradient" size="md" icon={PlusCircle} className="w-full justify-center shadow-sm">
                Create Project
              </Button>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-950/50 text-indigo-300 font-semibold border border-indigo-500/20 shadow-xs'
                      : 'text-zinc-400 hover:bg-[#27272A] hover:text-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Demo Switcher at Bottom */}
        <div className="p-4 border-t border-[#27272A] bg-[#111113]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-9 h-9 rounded-xl object-cover border border-[#27272A] bg-[#18181B] flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#FAFAFA] truncate">{user?.name}</p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.course || 'Student'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Demo Switcher Mini Pills */}
          <div className="pt-2 border-t border-[#27272A]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Switch Demo User:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => quickSwitchDemoUser('mohit@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded-lg border transition-all ${
                  user?.email === 'mohit@teamforge.app'
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                    : 'bg-[#18181B] text-zinc-400 border-[#27272A] hover:bg-[#27272A] hover:text-zinc-200'
                }`}
              >
                Mohit
              </button>
              <button
                onClick={() => quickSwitchDemoUser('priya@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded-lg border transition-all ${
                  user?.email === 'priya@teamforge.app'
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                    : 'bg-[#18181B] text-zinc-400 border-[#27272A] hover:bg-[#27272A] hover:text-zinc-200'
                }`}
              >
                Priya
              </button>
              <button
                onClick={() => quickSwitchDemoUser('aarav@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded-lg border transition-all ${
                  user?.email === 'aarav@teamforge.app'
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                    : 'bg-[#18181B] text-zinc-400 border-[#27272A] hover:bg-[#27272A] hover:text-zinc-200'
                }`}
              >
                Aarav
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-[#09090B]/85 backdrop-blur-md border-b border-[#27272A] px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:bg-[#18181B] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-white text-base">TEAMFORGE</span>
          </div>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects, skills, students..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#18181B] border border-[#27272A] text-zinc-200 placeholder-zinc-500 rounded-xl focus:bg-[#111113] focus:border-indigo-500 focus:outline-none transition-all"
            />
          </form>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Dropdown Component */}
            <NotificationDropdown />

            {/* Quick User Avatar */}
            <Link to="/profile" className="flex items-center gap-2 pl-2">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-8 h-8 rounded-xl object-cover border border-[#27272A] bg-[#18181B]"
              />
              <span className="hidden sm:inline-block text-xs font-semibold text-zinc-300 max-w-[100px] truncate">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-[#18181B] border-r border-[#27272A] h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#27272A] mb-4">
                  <span className="font-bold text-white">TEAMFORGE</span>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-zinc-400" /></button>
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-500/20'
                            : 'text-zinc-400 hover:bg-[#27272A] hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-zinc-400" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111113]/95 backdrop-blur-md border-t border-[#27272A] z-30 flex items-center justify-around px-2">
        <Link to="/dashboard" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname === '/dashboard' ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-indigo-400'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link to="/groups" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname.startsWith('/groups') ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-indigo-400'}`}>
          <Users className="w-5 h-5" />
          <span>Chat</span>
        </Link>
        <Link to="/projects/create" className="flex flex-col items-center gap-1 text-[10px] font-medium text-indigo-400">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span>Create</span>
        </Link>
        <Link to="/projects" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname === '/projects' ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-indigo-400'}`}>
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname === '/profile' ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-indigo-400'}`}>
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};
