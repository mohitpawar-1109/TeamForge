import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';

export const Navbar = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#27272A] bg-[#09090B]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-indigo-400 bg-clip-text text-transparent">
              TEAM<span className="text-indigo-400">FORGE</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
              AI MATCH
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            How It Works
          </a>
          <Link to="/projects" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Explore Projects
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm" icon={ArrowRight}>
                Dashboard ({user?.name})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" icon={LogIn} className="text-zinc-300 hover:text-white hover:bg-[#18181B]">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
