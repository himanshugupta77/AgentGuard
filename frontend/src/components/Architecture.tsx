import React from 'react'

export const Architecture: React.FC = () => {
  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6" id="architecture">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="shimmer-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A0E15] border border-[#FF1F6B]/30 text-[#FFB3D1] text-xs font-semibold uppercase tracking-wider mb-3">
          Under the Hood
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Non-Intrusive In-Memory Architecture</h2>
        <p className="text-[#B9A9B1] mt-3">
          Deploy as a local sidecar daemon, eBPF driver, or lightweight Python wrapper around your agent frameworks.
        </p>
      </div>

      <div className="spotlight-card rounded-2xl p-8 max-w-4xl mx-auto relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-center font-mono">
          {/* Agent Loop */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-[#FF1F6B]/40 transition-all">
            <div className="text-[#FFB3D1] text-sm font-bold">Agent Loop</div>
            <div className="text-[10px] text-white/40 mt-1">LangChain, AutoGen, CrewAI</div>
          </div>

          <div className="text-[#FF1F6B] text-xl font-bold flex justify-center animate-pulse">
            →
          </div>

          {/* Gateway */}
          <div className="p-4 rounded-xl bg-[#1d0a14] border border-[#FF1F6B]/60 shadow-[0_0_20px_rgba(255,31,107,0.2)] hover:shadow-[0_0_30px_rgba(255,31,107,0.4)] transition-all">
            <div className="text-white text-sm font-bold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF1F6B] animate-ping"></span>
              <span>Gateway</span>
            </div>
            <div className="text-[10px] text-[#FFB3D1] mt-1">FastAPI / Unix Domain Socket</div>
          </div>

          <div className="text-[#FF1F6B] text-xl font-bold flex justify-center animate-pulse">
            →
          </div>

          {/* Host / Sandbox */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-[#3DDC97]/40 transition-all">
            <div className="text-emerald-400 text-sm font-bold">Host / Sandbox</div>
            <div className="text-[10px] text-white/40 mt-1">Local Filesystem, Shell, DB</div>
          </div>
        </div>

        {/* Characteristic Badges */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-wrap justify-center gap-3 text-xs font-mono text-[#B9A9B1]">
          <span className="px-3 py-1 rounded bg-white/[0.04] border border-white/10 hover:border-[#FF1F6B]/50 transition-colors">
            FastAPI 20k RPS Gateway
          </span>
          <span className="px-3 py-1 rounded bg-white/[0.04] border border-white/10 hover:border-[#FF1F6B]/50 transition-colors">
            SHA-256 Hash Chained Ledger
          </span>
          <span className="px-3 py-1 rounded bg-white/[0.04] border border-white/10 hover:border-[#FF1F6B]/50 transition-colors">
            Deterministic AST Parser
          </span>
          <span className="px-3 py-1 rounded bg-white/[0.04] border border-white/10 hover:border-[#FF1F6B]/50 transition-colors">
            Sliding-Window Burst Tracker
          </span>
          <span className="px-3 py-1 rounded bg-white/[0.04] border border-white/10 hover:border-[#FF1F6B]/50 transition-colors">
            Zero External SaaS Dependency
          </span>
        </div>
      </div>
    </section>
  )
}
