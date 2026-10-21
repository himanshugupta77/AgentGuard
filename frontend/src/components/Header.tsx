import React from 'react'
import { Shield, Sparkles, Activity } from 'lucide-react'

interface HeaderProps {
  isBackendConnected: boolean
  onOpenDemo: () => void
}

export const Header: React.FC<HeaderProps> = ({ isBackendConnected, onOpenDemo }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050204]/80 border-b border-white/[0.08] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF1F6B] via-[#B0004A] to-[#FF2D7A] p-[1px] flex items-center justify-center shadow-[0_0_15px_rgba(255,31,107,0.4)] group-hover:shadow-[0_0_22px_rgba(255,31,107,0.7)] transition-shadow duration-300">
            <div className="w-full h-full bg-[#18050e] rounded-[7px] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#FF1F6B] group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div className="flex items-center">
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-white/90">Agent</span>
            <span className="font-extrabold text-lg tracking-tight text-[#FF1F6B] group-hover:drop-shadow-[0_0_8px_rgba(255,31,107,0.6)] transition-all">Guard</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-white/10 text-[#B9A9B1] border border-white/10">v2.4</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#hero" className="hover:text-white transition-colors duration-150">Home</a>
          <a href="#pipeline" className="hover:text-white transition-colors duration-150">Features</a>
          <a href="#engine" className="hover:text-white transition-colors duration-150">How it works</a>
          <a href="#demo" onClick={onOpenDemo} className="hover:text-[#FF1F6B] transition-colors duration-150 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF1F6B] animate-pulse"></span>
            Live Demo
          </a>
          <a href="#dashboard" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <a href="#architecture" className="hover:text-white transition-colors duration-150">Architecture</a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Live Backend Connection Indicator */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
            isBackendConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{isBackendConnected ? 'Live Gateway (ws)' : 'Offline Simulation'}</span>
          </div>

          <a 
            href="#demo"
            onClick={onOpenDemo}
            className="pink-glow-btn px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold rounded-full bg-gradient-to-r from-[#FF1F6B] to-[#B0004A] text-white hover:opacity-90 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,31,107,0.4)]"
          >
            <span>Try Live Demo</span>
            <Sparkles className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  )
}
