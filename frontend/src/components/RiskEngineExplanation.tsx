import React from 'react'

export const RiskEngineExplanation: React.FC = () => {
  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6" id="engine">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="shimmer-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3A0620] border border-[#FF2D7A]/40 text-[#FF2D7A] text-xs font-semibold uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(255,31,107,0.25)]">
          Dynamic Scoring
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Deterministic Three-Tier Evaluation</h2>
        <p className="text-slate-400 mt-3">Calculated in under 4ms using semantic heuristics, parameter ASTs, and target reputation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: ALLOW */}
        <div className="spotlight-card rounded-2xl p-6 border-l-4 border-l-[#3DDC97] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30">
                ALLOW
              </span>
              <span className="font-mono text-xs text-white/60">Risk Score: 0 – 29</span>
            </div>
            <h3 className="text-xl font-bold text-white">Low Impact Operations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Read-only file queries, public documentation web scraping, safe linting commands, non-mutating search queries.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-white/60">Execution Latency:</span>
            <span className="text-[#3DDC97] font-bold">&lt; 1.2ms</span>
          </div>
        </div>

        {/* Tier 2: ASK */}
        <div className="spotlight-card rounded-2xl p-6 border-l-4 border-l-[#FFBD6B] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FFBD6B]/15 text-[#FFBD6B] border border-[#FFBD6B]/30">
                ASK (HUMAN REVIEW)
              </span>
              <span className="font-mono text-xs text-white/60">Risk Score: 30 – 69</span>
            </div>
            <h3 className="text-xl font-bold text-white">Ambiguous Mutations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Bulk rename of files, outbound webhooks with novel payloads, modification of config files, high-cost LLM sub-delegation.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-white/60">Verification Hook:</span>
            <span className="text-[#FFBD6B] font-bold">Slack / Webhook 2FA</span>
          </div>
        </div>

        {/* Tier 3: BLOCK */}
        <div className="spotlight-card rounded-2xl p-6 border-l-4 border-l-[#FF1F6B] relative overflow-hidden shadow-[0_0_20px_rgba(255,31,107,0.2)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FF1F6B]/20 text-[#FF1F6B] border border-[#FF1F6B]/40">
                BLOCK
              </span>
              <span className="font-mono text-xs text-white/60">Risk Score: 70 – 100</span>
            </div>
            <h3 className="text-xl font-bold text-white">Catastrophic Actions</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Recursive deletions (`rm -rf`), reading SSH keys or `.env`, dropping database tables, network socket binds to blacklisted IPs.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-white/60">Containment:</span>
            <span className="text-[#FF1F6B] font-bold">Instant Hard Trap</span>
          </div>
        </div>
      </div>

      {/* Adaptive Threat Scoring Dial */}
      <div className="mt-8 spotlight-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-white/10">
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="56"
                cy="56"
                r="46"
                fill="none"
                stroke="url(#riskDialGradPink)"
                strokeDasharray="289"
                strokeDashoffset="65"
                strokeLinecap="round"
                strokeWidth="8"
              />
              <defs>
                <linearGradient id="riskDialGradPink" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#3DDC97" />
                  <stop offset="50%" stopColor="#FFBD6B" />
                  <stop offset="100%" stopColor="#FF1F6B" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="text-xs font-mono text-white/50 block">MAX</span>
              <span className="text-xl font-mono font-extrabold text-[#FF1F6B]">100</span>
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>Adaptive Threat Scoring Dial</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF1F6B]/20 text-[#FF1F6B] border border-[#FF1F6B]/30 font-bold">
                Dynamic AST
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Calculated via parameter tree traversal, known blast-radius heuristics, and caller permission boundaries before kernel dispatch.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97]"></span> Allow (0-29)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFBD6B]"></span> Ask (30-69)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF1F6B]"></span> Block (70-100)</div>
        </div>
      </div>
    </section>
  )
}
