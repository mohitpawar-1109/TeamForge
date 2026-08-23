import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';

export const Navbar = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#242424] bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse" />
            <span className="text-base font-mono font-bold tracking-widest text-[#F5F5F5]">
              TEAM<span className="text-[#E50914]"> (FORGE)</span>
            </span>
          </div>
          <span className="hidden sm:inline-block ml-2 text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
            AI MATCH
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/#features" className="text-xs font-mono font-bold text-[#888888] hover:text-[#F5F5F5] transition-colors">
            // FEATURES
          </a>
          <a href="/#how-it-works" className="text-xs font-mono font-bold text-[#888888] hover:text-[#F5F5F5] transition-colors">
            // WORKFLOW
          </a>
          <Link to="/projects" className="text-xs font-mono font-bold text-[#888888] hover:text-[#F5F5F5] transition-colors">
            // EXPLORE_PROJECTS
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
                <Button variant="outline" size="sm" icon={LogIn}>
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
