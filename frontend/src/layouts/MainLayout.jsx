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
    { label: 'Community', path: '/community', icon: MessageSquare },
    { label: 'Explore', path: '/projects', icon: Compass },
    { label: 'Skill Network', path: '/network', icon: Network },
    { label: 'My Projects', path: '/my-projects', icon: FolderGit2 },
    { label: 'Invitations', path: '/invitations', icon: Mail, badge: unreadCount > 0 ? unreadCount : null },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white sticky top-0 h-screen z-30 justify-between">
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-600 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              TEAM<span className="text-brand-600">FORGE</span>
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
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Demo Switcher at Bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.course || 'Student'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Demo Switcher Mini Pills */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Switch Demo User:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => quickSwitchDemoUser('mohit@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded border ${user?.email === 'mohit@teamforge.app' ? 'bg-brand-100 text-brand-800 border-brand-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                Mohit
              </button>
              <button
                onClick={() => quickSwitchDemoUser('priya@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded border ${user?.email === 'priya@teamforge.app' ? 'bg-brand-100 text-brand-800 border-brand-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                Priya
              </button>
              <button
                onClick={() => quickSwitchDemoUser('aarav@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded border ${user?.email === 'aarav@teamforge.app' ? 'bg-brand-100 text-brand-800 border-brand-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
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
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-slate-900 text-base">TEAMFORGE</span>
          </div>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects, skills, students..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
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
                className="w-8 h-8 rounded-xl object-cover border border-slate-200 bg-slate-100"
              />
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-white h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <span className="font-bold text-slate-900">TEAMFORGE</span>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-brand-50"
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 p-3 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium"
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around px-2">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-brand-600">
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link to="/projects" className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-brand-600">
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </Link>
        <Link to="/projects/create" className="flex flex-col items-center gap-1 text-[10px] font-medium text-brand-600">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span>Create</span>
        </Link>
        <Link to="/invitations" className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-brand-600">
          <Mail className="w-5 h-5" />
          <span>Invites</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-brand-600">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};
