import React, { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight, Play, ShieldAlert, Cpu, Activity } from 'lucide-react'
import { StatsSummary } from '../types'

interface HeroProps {
  stats: StatsSummary | null
  onOpenDemo: () => void
}

export const Hero: React.FC<HeroProps> = ({ stats, onOpenDemo }) => {
  const [animatedAllow, setAnimatedAllow] = useState(0)
  const [animatedBlock, setAnimatedBlock] = useState(0)

  useEffect(() => {
    const targetAllow = stats?.decision_mix.allow_count || 1284
    const targetBlock = stats?.hard_blocks || 37
    let current = 0
    const duration = 1200
    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimatedAllow(Math.floor(ease * targetAllow))
      setAnimatedBlock(Math.floor(ease * targetBlock))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [stats])

  return (
    <section className="relative z-10 pt-14 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-6" id="hero">
      <div className="relative flex flex-col items-center text-center">
        {/* Shimmer Pill Badge */}
        <div 
          onClick={onOpenDemo}
          className="shimmer-pill inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3A0620] border border-[#FF2D7A]/30 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(255,31,107,0.25)] hover:border-[#FF2D7A]/60 transition-all cursor-pointer group"
        >
          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-[#FF1F6B] text-white shadow-[0_0_10px_rgba(255,31,107,0.5)]">
            NEW
          </span>
          <span className="text-xs font-medium text-[#FFD1E3]">
            Interactive live sandbox now available
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FF2D7A] group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.08] mb-6">
          The Safety Layer Your AI Agents <br className="hidden sm:block" />
          Never Knew <span className="crimson-gradient-text inline-block">They Needed.</span>
        </h1>

        {/* Tagline */}
        <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
          AgentGuard checks every high-impact action before damage happens. <br className="hidden sm:inline" />
          <span className="text-white font-medium">Silent when safe.</span>
          <span className="text-[#FFBD6B] font-medium"> Explainable when risky.</span>
          <span className="text-[#FF1F6B] font-medium"> Protective when critical.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <a
            href="#demo"
            onClick={onOpenDemo}
            className="pink-glow-btn px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF1F6B] to-[#B0004A] text-white font-extrabold text-sm tracking-wide flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(255,31,107,0.5)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Watch Live Demo</span>
          </a>
          <a
            href="#pipeline"
            className="px-8 py-3.5 rounded-full border border-[#FF1F6B]/50 hover:border-[#FF1F6B] text-white hover:text-[#FF1F6B] bg-transparent hover:bg-[#FF1F6B]/10 transition-all text-sm font-semibold tracking-wide hover:scale-105 active:scale-95"
          >
            How it works
          </a>
        </div>

        {/* Floating Glass Telemetry Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl items-center relative text-left">
          {/* Card 1: Realtime Intercepts */}
          <div className="spotlight-card rounded-2xl p-5 md:animate-float-slow shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-white/50 tracking-wider uppercase font-mono">Realtime Intercepts</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] hover:border-emerald-500/30 transition-colors">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#3DDC97]"></span> Allowed
                </div>
                <div className="text-2xl font-bold text-white tracking-tight font-mono">{animatedAllow.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-400 mt-1 font-mono">{stats?.decision_mix.allow_pct || 97.2}% passed</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-[#FF1F6B]/25 hover:border-[#FF1F6B]/50 transition-colors">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#FF1F6B]"></span> Blocked
                </div>
                <div className="text-2xl font-bold text-[#FF1F6B] tracking-tight font-mono">{animatedBlock}</div>
                <div className="text-[10px] text-rose-400 mt-1 font-mono">0 breaches</div>
              </div>
            </div>
          </div>

          {/* Card 2: Risk Over Time Wave Chart */}
          <div className="spotlight-card rounded-2xl p-5 md:animate-float-delayed shadow-2xl border-[#FF1F6B]/20 relative">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-semibold text-white">Risk Over Time</div>
                <div className="text-[11px] text-slate-400">Autonomous Execution Audit (24h)</div>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-[#FF1F6B]/20 border border-[#FF1F6B]/40 text-[#FF1F6B] text-[10px] font-mono font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(255,31,107,0.3)] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF1F6B]"></span>
                <span>92 BLOCKED</span>
              </div>
            </div>
            <div className="relative h-28 w-full mt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100">
                <defs>
                  <linearGradient id="areaPinkGrad" x1="0%" x2="0%" y1="0%" y2="1">
                    <stop offset="0%" stopColor="#FF1F6B" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#FF1F6B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="65" x2="300" y2="65" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <path d="M0,80 Q35,70 70,60 T140,45 T190,65 T240,20 T300,50 L300,95 L0,95 Z" fill="url(#areaPinkGrad)" />
                <path d="M0,80 Q35,70 70,60 T140,45 T190,65 T240,20 T300,50" fill="none" stroke="#FF1F6B" strokeWidth="2.5" />
                <circle cx="240" cy="20" r="5" fill="#FFFFFF" stroke="#FF1F6B" strokeWidth="3" />
                <circle cx="240" cy="20" r="10" fill="#FF1F6B" opacity="0.3" className="animate-ping" />
              </svg>
              <div className="absolute right-12 top-0 px-2 py-0.5 rounded bg-black/90 border border-[#FF1F6B] text-[9px] font-mono text-[#FFD1E3]">
                Severity: 92/100
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-white/40 font-mono mt-1 pt-1 border-t border-white/[0.05]">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
            </div>
          </div>

          {/* Card 3: Policy Engine Dial */}
          <div className="spotlight-card rounded-2xl p-5 md:animate-float-slow shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/50 uppercase font-mono tracking-wider">Policy Engine</span>
              <a href="#dashboard" className="w-6 h-6 rounded-full bg-[#FF1F6B]/20 text-[#FF1F6B] flex items-center justify-center hover:bg-[#FF1F6B] hover:text-white transition-colors" title="Engine Settings">
                <Cpu className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="#FF1F6B"
                    strokeWidth="6"
                    strokeDasharray="201.06"
                    strokeDashoffset="64.3"
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute font-mono font-extrabold text-lg text-white">68%</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">Policy Coverage</div>
                <div className="text-xs text-slate-400 mt-1">24 Active Rules</div>
                <div className="inline-block mt-2 text-[10px] font-mono text-[#3DDC97] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  +18% this week
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Marquee Ticker */}
        <div className="mt-20 w-full overflow-hidden border-t border-b border-white/[0.08] py-5 bg-[#121012]/70 backdrop-blur-sm">
          <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3 text-center">
            Built for teams running autonomous agents
          </div>
          <div className="flex overflow-hidden relative w-full">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">⚡</span> FastAPI</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">⚛</span> React 19</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">💾</span> SQLite / DuckDB</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">🐍</span> Python 3.12 SDK</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">🌐</span> REST &amp; gRPC Gateway</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">🛡️</span> LangChain / AutoGen / CrewAI</span>
              <span className="text-[#FF2D7A]/40">✦</span>
            </div>
            <div aria-hidden="true" className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">⚡</span> FastAPI</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">⚛</span> React 19</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">💾</span> SQLite / DuckDB</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">🐍</span> Python 3.12 SDK</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">🌐</span> REST &amp; gRPC Gateway</span>
              <span className="text-[#FF2D7A]/40">✦</span>
              <span className="flex items-center gap-2 text-sm font-mono text-white/80 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.08] hover:border-[#FF2D7A]/50 transition-colors"><span className="text-[#FF2D7A]">🛡️</span> LangChain / AutoGen / CrewAI</span>
              <span className="text-[#FF2D7A]/40">✦</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
