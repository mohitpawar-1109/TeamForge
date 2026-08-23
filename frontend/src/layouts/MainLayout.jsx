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
  Layers,
  MessageSquare,
  Network,
  Search,
  Trophy,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import { Button } from '../components/common/Button';
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
    {
      label: 'Invitations',
      path: '/invitations',
      icon: Mail
    },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#281A21] text-[#F6E8E2] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#703344] bg-[#4A2A35] sticky top-0 h-screen z-30 justify-between">
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#703344] gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] flex items-center justify-center shadow-md shadow-[#A84A4D]/25">
              <Layers className="w-4 h-4 text-[#F6E8E2]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#F6E8E2]">
              TEAM<span className="text-[#CB6B5A]">FORGE</span>
            </span>
          </div>

          {/* Quick Create Action */}
          <div className="p-4">
            <Link to="/projects/create">
              <Button variant="primary" size="md" icon={PlusCircle} className="w-full justify-center shadow-sm">
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
                      ? 'bg-[#703344] text-[#F6E8E2] font-semibold border border-[#A84A4D]/50 shadow-xs'
                      : 'text-[#DDA081] hover:bg-[#703344]/50 hover:text-[#F6E8E2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F6E8E2]' : 'text-[#DDA081]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A84A4D] text-[#F6E8E2]">
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#86B190] bg-[#5B8A68]/20 border border-[#5B8A68]/40 hover:bg-[#5B8A68]/30 transition-all cursor-pointer mt-2 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-3.5 h-3.5 text-[#86B190]" />
                  <span>Install Web App</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider bg-[#5B8A68]/30 text-[#86B190] px-1.5 py-0.5 rounded-full">
                  PWA
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* User Card & Demo Switcher at Bottom */}
        <div className="p-4 border-t border-[#703344] bg-[#4A2A35]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-9 h-9 rounded-xl object-cover border border-[#703344] bg-[#281A21] flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#F6E8E2] truncate">{user?.name}</p>
                <p className="text-[11px] text-[#DDA081] truncate">{user?.course || 'Student'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-[#DDA081] hover:text-[#E07D82] hover:bg-[#703344] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Demo Switcher Mini Pills */}
          <div className="pt-2 border-t border-[#703344]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA081] block mb-1">
              Switch Demo User:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => quickSwitchDemoUser('mohit@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded-lg border transition-all ${
                  user?.email === 'mohit@teamforge.app'
                    ? 'bg-[#A84A4D] text-[#F6E8E2] border-[#CB6B5A]/60 font-bold'
                    : 'bg-[#281A21] text-[#DDA081] border-[#703344] hover:bg-[#703344] hover:text-[#F6E8E2]'
                }`}
              >
                Mohit
              </button>
              <button
                onClick={() => quickSwitchDemoUser('priya@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded-lg border transition-all ${
                  user?.email === 'priya@teamforge.app'
                    ? 'bg-[#A84A4D] text-[#F6E8E2] border-[#CB6B5A]/60 font-bold'
                    : 'bg-[#281A21] text-[#DDA081] border-[#703344] hover:bg-[#703344] hover:text-[#F6E8E2]'
                }`}
              >
                Priya
              </button>
              <button
                onClick={() => quickSwitchDemoUser('aarav@teamforge.app')}
                className={`text-[10px] font-semibold py-1 rounded-lg border transition-all ${
                  user?.email === 'aarav@teamforge.app'
                    ? 'bg-[#A84A4D] text-[#F6E8E2] border-[#CB6B5A]/60 font-bold'
                    : 'bg-[#281A21] text-[#DDA081] border-[#703344] hover:bg-[#703344] hover:text-[#F6E8E2]'
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
        <header className="sticky top-0 z-20 h-16 bg-[#281A21]/90 backdrop-blur-md border-b border-[#703344] px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#DDA081] hover:bg-[#4A2A35] hover:text-[#F6E8E2]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-[#F6E8E2] text-base">TEAMFORGE</span>
          </div>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-[#DDA081] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects, skills, students..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#4A2A35] border border-[#703344] text-[#F6E8E2] placeholder-[#DDA081] rounded-xl focus:bg-[#281A21] focus:border-[#CB6B5A] focus:outline-none transition-all"
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
                className="w-8 h-8 rounded-xl object-cover border border-[#703344] bg-[#4A2A35]"
              />
              <span className="hidden sm:inline-block text-xs font-semibold text-[#DDA081] max-w-[100px] truncate">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-[#4A2A35] border-r border-[#703344] h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#703344] mb-4">
                  <span className="font-bold text-[#F6E8E2]">TEAMFORGE</span>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-[#DDA081]" /></button>
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
                            ? 'bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/50'
                            : 'text-[#DDA081] hover:bg-[#703344]/50 hover:text-[#F6E8E2]'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#DDA081]" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {isInstallable && !isInstalled && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        promptInstall();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-[#86B190] bg-[#5B8A68]/20 border border-[#5B8A68]/40 hover:bg-[#5B8A68]/30 transition-all cursor-pointer mt-2"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-4 h-4 text-[#86B190]" />
                        <span>Install TeamForge App</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider bg-[#5B8A68]/30 text-[#86B190] px-1.5 py-0.5 rounded-full">
                        PWA
                      </span>
                    </button>
                  )}
                </nav>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 p-3 text-[#E07D82] hover:bg-[#703344] rounded-xl text-sm font-medium"
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#281A21]/95 backdrop-blur-md border-t border-[#703344] z-30 flex items-center justify-around px-2">
        <Link to="/dashboard" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname === '/dashboard' ? 'text-[#CB6B5A] font-bold' : 'text-[#DDA081] hover:text-[#CB6B5A]'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link to="/groups" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname.startsWith('/groups') ? 'text-[#CB6B5A] font-bold' : 'text-[#DDA081] hover:text-[#CB6B5A]'}`}>
          <Users className="w-5 h-5" />
          <span>Chat</span>
        </Link>
        <Link to="/projects/create" className="flex flex-col items-center gap-1 text-[10px] font-medium text-[#CB6B5A]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] text-[#F6E8E2] flex items-center justify-center shadow-md shadow-[#A84A4D]/25">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span>Create</span>
        </Link>
        <Link to="/projects" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname === '/projects' ? 'text-[#CB6B5A] font-bold' : 'text-[#DDA081] hover:text-[#CB6B5A]'}`}>
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 text-[10px] font-medium ${location.pathname === '/profile' ? 'text-[#CB6B5A] font-bold' : 'text-[#DDA081] hover:text-[#CB6B5A]'}`}>
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};
