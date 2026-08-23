import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';

export const Navbar = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#703344]/50 bg-[#281A21]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] flex items-center justify-center shadow-md shadow-[#A84A4D]/25 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-[#F6E8E2]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#F6E8E2]">
              TEAM<span className="text-[#CB6B5A]">FORGE</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-[#4A2A35] text-[#DDA081] border border-[#703344]">
              AI MATCH
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#features" className="text-sm font-medium text-[#DDA081] hover:text-[#CB6B5A] transition-colors">
            Features
          </a>
          <a href="/#how-it-works" className="text-sm font-medium text-[#DDA081] hover:text-[#CB6B5A] transition-colors">
            How It Works
          </a>
          <Link to="/projects" className="text-sm font-medium text-[#DDA081] hover:text-[#CB6B5A] transition-colors">
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
                <Button variant="ghost" size="sm" icon={LogIn} className="text-[#DDA081] hover:text-[#F6E8E2] hover:bg-[#4A2A35]">
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
